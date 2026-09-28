import React, { useMemo, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { AppData, QuoteDocument } from '../types';
import { calculateTotals, effectiveStatus, formatMoney } from '../domain';
import { localeFor, tr } from '../i18n';
import { sharePdf } from '../pdf';
import { Card, Pill, PrimaryButton, SecondaryButton, ScreenTitle } from '../ui';
import { colors } from '../theme';

export function PreviewScreen({ data, doc, onBack, onEdit, onUpdate, onDuplicate, onConvert, onDelete }: { data:AppData; doc:QuoteDocument; onBack:()=>void; onEdit:()=>void; onUpdate:(doc:QuoteDocument)=>void; onDuplicate:()=>void; onConvert?:()=>void; onDelete:()=>void }) {
  const [sharing,setSharing]=useState(false);
  const lang=data.business.language;
  const totals=useMemo(()=>calculateTotals(doc),[doc]);
  const money=(n:number)=>formatMoney(n,data.business.currency,localeFor(lang));
  const status=effectiveStatus(doc);
  const share=async()=>{
    setSharing(true);
    try{
      await sharePdf(data.business,doc);
      if(doc.status==='draft') onUpdate({...doc,status:'sent',updatedAt:new Date().toISOString()});
    }catch(e){Alert.alert('OX Invoice',e instanceof Error?e.message:'PDF error');}
    finally{setSharing(false);}
  };
  const primaryStatusLabel=doc.kind==='estimate'
    ? (status==='accepted'?tr(lang,'accepted'):(lang==='fr'?'Marquer accepté':'Mark accepted'))
    : (status==='paid'?tr(lang,'statusPaid'):tr(lang,'markPaid'));
  const togglePrimaryStatus=()=>onUpdate({...doc,status:doc.kind==='estimate'?(status==='accepted'?'sent':'accepted'):(status==='paid'?'sent':'paid'),updatedAt:new Date().toISOString()});

  return <ScrollView contentContainerStyle={styles.content}>
    <ScreenTitle eyebrow={doc.number} title={tr(lang,'preview')} action={<SecondaryButton compact title="‹" onPress={onBack}/>}/>
    <View style={styles.toolbar}><View style={{flex:1}}><SecondaryButton title={lang==='fr'?'Modifier':'Edit'} onPress={onEdit}/></View><View style={{flex:1}}><PrimaryButton title={sharing?'PDF…':tr(lang,'sendShare')} disabled={sharing} onPress={share}/></View></View>
    <View style={styles.statusLine}><Pill text={status==='paid'?tr(lang,'statusPaid'):status==='overdue'?tr(lang,'statusOverdue'):status==='accepted'?tr(lang,'accepted'):status==='sent'?tr(lang,'sent'):tr(lang,'draft')} tone={status==='paid'||status==='accepted'?'green':status==='overdue'?'red':status==='sent'?'blue':'neutral'}/><Text style={styles.dateMeta}>{doc.issueDate} → {doc.dueDate}</Text></View>
    <Card style={styles.paper}>
      <View style={styles.header}><View>{data.business.logoDataUri?<Image source={{uri:data.business.logoDataUri}} resizeMode="contain" style={styles.logo}/>:<View style={[styles.mark,{backgroundColor:data.business.accent}]}><Text style={styles.markText}>{(data.business.name.trim().charAt(0)||'B').toUpperCase()}</Text></View>}<Text style={styles.biz}>{data.business.name||'OX Invoice'}</Text></View><View style={{alignItems:'flex-end'}}><Text style={[styles.docType,{color:data.business.accent}]}>{doc.kind==='invoice'?(lang==='fr'?'FACTURE':'INVOICE'):(lang==='fr'?'DEVIS':'ESTIMATE')}</Text><Text style={styles.number}>#{doc.number}</Text><Text style={styles.headerDate}>{lang==='fr'?'Émis':'Issued'} · {doc.issueDate}</Text><Text style={styles.headerDate}>{doc.kind==='estimate'?(lang==='fr'?'Valable':'Valid'):(lang==='fr'?'Échéance':'Due')} · {doc.dueDate}</Text></View></View>
      <View style={styles.parties}><View style={{flex:1}}><Text style={styles.eyebrow}>{lang==='fr'?'DE':'FROM'}</Text><Text style={styles.partyName}>{data.business.name||'-'}</Text><Text style={styles.partyText}>{data.business.address||data.business.email||'-'}</Text></View><View style={{flex:1}}><Text style={styles.eyebrow}>{lang==='fr'?'FACTURÉ À':'BILL TO'}</Text><Text style={styles.partyName}>{doc.client.name||'-'}</Text><Text style={styles.partyText}>{doc.client.address||doc.client.email||'-'}</Text></View></View>
      <View style={styles.tableHead}><Text style={[styles.th,{flex:1}]}>{lang==='fr'?'DESCRIPTION':'DESCRIPTION'}</Text><Text style={[styles.th,{width:72,textAlign:'right'}]}>{lang==='fr'?'MONTANT':'AMOUNT'}</Text></View>{doc.items.map(i=><View key={i.id} style={styles.line}><View style={{flex:1}}><Text style={styles.lineTitle}>{i.title||'-'}</Text>{i.details?<Text style={styles.lineDetails}>{i.details}</Text>:null}<Text style={styles.qtyRate}>{i.quantity} × {money(i.rate)}</Text></View><Text style={styles.lineAmount}>{money(i.quantity*i.rate)}</Text></View>)}
      <View style={styles.summary}><View style={styles.sumRow}><Text style={styles.sumLabel}>{lang==='fr'?'Sous-total':'Subtotal'}</Text><Text style={styles.sumValue}>{money(totals.subtotal)}</Text></View>{doc.discountPct>0?<View style={styles.sumRow}><Text style={styles.sumLabel}>{tr(lang,'discount')} {doc.discountPct}%</Text><Text style={styles.sumValue}>-{money(totals.discount)}</Text></View>:null}{doc.taxPct>0?<View style={styles.sumRow}><Text style={styles.sumLabel}>{tr(lang,'tax')} {doc.taxPct}%</Text><Text style={styles.sumValue}>{money(totals.tax)}</Text></View>:null}<View style={[styles.grand,{backgroundColor:`${data.business.accent}12`}]}><Text style={styles.grandText}>{tr(lang,'total')}</Text><Text style={styles.grandValue}>{money(totals.total)}</Text></View>{doc.depositPct>0?<><View style={styles.sumRow}><Text style={styles.sumLabel}>{tr(lang,'deposit')} {doc.depositPct}%</Text><Text style={styles.sumValue}>{money(totals.deposit)}</Text></View><View style={styles.sumRow}><Text style={[styles.sumLabel,{fontWeight:'800'}]}>{tr(lang,'balance')}</Text><Text style={[styles.sumValue,{color:data.business.accent}]}>{money(totals.balance)}</Text></View></>:null}</View>
      {doc.notes?<View style={styles.notes}><Text style={styles.eyebrow}>{tr(lang,'notes').toUpperCase()}</Text><Text style={styles.partyText}>{doc.notes}</Text></View>:null}
      {data.business.paymentDetails?<View style={styles.notes}><Text style={styles.eyebrow}>{tr(lang,'paymentDetails').toUpperCase()}</Text><Text style={styles.partyText}>{data.business.paymentDetails}</Text></View>:null}
    </Card>
    {onConvert?<PrimaryButton title={lang==='fr'?'Convertir en facture':'Convert to invoice'} onPress={onConvert}/>:null}
    <View style={styles.actions}><View style={{flex:1}}><SecondaryButton title={primaryStatusLabel} onPress={togglePrimaryStatus}/></View><View style={{flex:1}}><SecondaryButton title={tr(lang,'duplicate')} onPress={onDuplicate}/></View></View>
    <SecondaryButton title={tr(lang,'delete')} onPress={()=>Alert.alert('OX Invoice',lang==='fr'?'Supprimer définitivement ce document ?':'Delete this document permanently?',[{text:lang==='fr'?'Annuler':'Cancel',style:'cancel'},{text:tr(lang,'delete'),style:'destructive',onPress:onDelete}])}/>
  </ScrollView>
}
const styles=StyleSheet.create({content:{padding:20,paddingBottom:50,maxWidth:720,width:'100%',alignSelf:'center',gap:14},toolbar:{flexDirection:'row',gap:10},statusLine:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},dateMeta:{fontSize:11,color:colors.faint,fontWeight:'600'},paper:{padding:22,minHeight:520,borderRadius:4},header:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start',paddingBottom:18,borderBottomWidth:1,borderBottomColor:colors.line},mark:{width:34,height:34,borderRadius:9,alignItems:'center',justifyContent:'center'},markText:{color:'#fff',fontSize:18,fontWeight:'900'},logo:{width:110,height:40,marginBottom:3},biz:{fontSize:15,fontWeight:'900',color:colors.ink,marginTop:8},docType:{fontSize:20,fontWeight:'900',letterSpacing:.7},number:{fontSize:10,color:colors.muted,marginTop:4},headerDate:{fontSize:8.5,color:colors.faint,marginTop:3,fontWeight:'600'},parties:{flexDirection:'row',gap:18,paddingVertical:20},eyebrow:{fontSize:8,fontWeight:'800',letterSpacing:1,color:colors.faint,marginBottom:5},partyName:{fontSize:11,fontWeight:'800',color:colors.ink},partyText:{fontSize:10,lineHeight:15,color:colors.muted,marginTop:3},tableHead:{flexDirection:'row',backgroundColor:colors.soft,padding:8},th:{fontSize:8,fontWeight:'800',color:colors.muted},line:{flexDirection:'row',paddingHorizontal:8,paddingVertical:11,borderBottomWidth:1,borderBottomColor:colors.line},lineTitle:{fontSize:10.5,fontWeight:'800',color:colors.ink},lineDetails:{fontSize:9,color:colors.muted,marginTop:2},qtyRate:{fontSize:8.5,color:colors.faint,marginTop:3},lineAmount:{width:72,textAlign:'right',fontSize:10,fontWeight:'800',color:colors.ink},summary:{width:'58%',alignSelf:'flex-end',marginTop:18,gap:5},sumRow:{flexDirection:'row',justifyContent:'space-between'},sumLabel:{fontSize:10,color:colors.muted},sumValue:{fontSize:10,fontWeight:'700',color:colors.ink},grand:{flexDirection:'row',justifyContent:'space-between',padding:9,borderRadius:7,marginTop:4},grandText:{fontSize:11,fontWeight:'900',color:colors.ink},grandValue:{fontSize:13,fontWeight:'900',color:colors.ink},notes:{marginTop:22},actions:{flexDirection:'row',gap:10}});

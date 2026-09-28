import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import type { AppData, DocumentKind, QuoteDocument } from '../types';
import { calculateTotals, effectiveStatus, formatMoney } from '../domain';
import { localeFor, tr } from '../i18n';
import { Card, Metric, Pill, PrimaryButton, SecondaryButton, ScreenTitle } from '../ui';
import { colors } from '../theme';

function statusTone(status: QuoteDocument['status']) { return status==='paid'?'green':status==='overdue'?'red':status==='accepted'?'green':status==='sent'?'blue':'neutral' as const; }

export function HomeScreen({ data, onCreate, onOpen, onSetupBusiness, onSeeAll }: { data:AppData; onCreate:(kind:DocumentKind)=>void; onOpen:(id:string)=>void; onSetupBusiness:()=>void; onSeeAll:()=>void }) {
  const { width } = useWindowDimensions();
  const compact = width < 380;
  const lang=data.business.language; const locale=localeFor(lang); const currency=data.business.currency;
  const metrics=useMemo(()=>{
    let unpaid=0,paid=0,overdue=0,pending=0;
    for(const d of data.documents){ const total=calculateTotals(d).total; const status=effectiveStatus(d); if(status==='paid')paid+=total; else if(status==='overdue')overdue+=total; else if(d.kind==='invoice'&&status==='sent')unpaid+=total; else if(d.kind==='estimate'&&(status==='draft'||status==='sent'))pending++; }
    return {unpaid,paid,overdue,pending};
  },[data.documents]);
  const recent=[...data.documents].sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)).slice(0,4);
  const statusLabel=(d:QuoteDocument)=> { const status=effectiveStatus(d); return status==='paid'?tr(lang,'statusPaid'):status==='overdue'?tr(lang,'statusOverdue'):status==='accepted'?tr(lang,'accepted'):status==='sent'?tr(lang,'sent'):tr(lang,'draft'); };
  return <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <ScreenTitle eyebrow="OX Invoice" title={tr(lang,'morning')} />
    <Text style={styles.sub}>{tr(lang,'glance')}</Text>
    {!data.business.name ? <Card style={styles.setup}><View style={{flex:1}}><Text style={styles.setupTitle}>{tr(lang,'setupBusiness')}</Text><Text style={styles.setupText}>{tr(lang,'setupHint')}</Text></View><SecondaryButton compact title="→" onPress={onSetupBusiness}/></Card>:null}
    <View style={styles.grid}>
      <Metric label={tr(lang,'unpaid')} value={formatMoney(metrics.unpaid,currency,locale)} tone="amber"/>
      <Metric label={tr(lang,'paid')} value={formatMoney(metrics.paid,currency,locale)} tone="green"/>
      <Metric label={tr(lang,'overdue')} value={formatMoney(metrics.overdue,currency,locale)} tone="red"/>
      <Metric label={tr(lang,'pending')} value={String(metrics.pending)} tone="blue"/>
    </View>
    <View style={[styles.actions,compact&&{flexDirection:'column'}]}><View style={{flex:1}}><PrimaryButton title={`＋ ${tr(lang,'newEstimate')}`} onPress={()=>onCreate('estimate')}/></View><View style={{flex:1}}><SecondaryButton title={`＋ ${tr(lang,'newInvoice')}`} onPress={()=>onCreate('invoice')}/></View></View>
    <View style={styles.sectionHead}><Text style={styles.sectionTitle}>{tr(lang,'recent')}</Text>{recent.length?<Pressable onPress={onSeeAll}><Text style={styles.link}>{tr(lang,'seeAll')}</Text></Pressable>:null}</View>
    {recent.length===0 ? <Card><Text style={styles.emptyTitle}>{tr(lang,'noDocs')}</Text><Text style={styles.emptyText}>{tr(lang,'noDocsBody')}</Text></Card> : <Card style={{padding:0}}>{recent.map((d,i)=>{const total=calculateTotals(d).total;return <Pressable key={d.id} onPress={()=>onOpen(d.id)} style={[styles.row,i>0&&styles.rowBorder]}><View style={styles.docIcon}><Text style={styles.docIconText}>{d.kind==='invoice'?'I':'E'}</Text></View><View style={{flex:1,minWidth:0}}><Text numberOfLines={1} style={styles.rowTitle}>{d.client.name || d.number}</Text><Text style={styles.rowMeta}>{d.number} · {d.issueDate}</Text></View><View style={{alignItems:'flex-end',gap:5}}><Text style={styles.amount}>{formatMoney(total,currency,locale)}</Text><Pill text={statusLabel(d)} tone={statusTone(effectiveStatus(d))}/></View></Pressable>})}</Card>}
  </ScrollView>
}
const styles=StyleSheet.create({content:{padding:20,paddingBottom:110,maxWidth:720,width:'100%',alignSelf:'center'},sub:{fontSize:15,color:colors.muted,marginTop:-12,marginBottom:18},setup:{flexDirection:'row',alignItems:'center',gap:12,marginBottom:14,backgroundColor:'#FBFCFD'},setupTitle:{fontSize:14,fontWeight:'800',color:colors.ink},setupText:{fontSize:12,color:colors.muted,marginTop:3},grid:{flexDirection:'row',flexWrap:'wrap',gap:10},actions:{flexDirection:'row',gap:10,marginTop:14},sectionHead:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:26,marginBottom:10},sectionTitle:{fontSize:17,fontWeight:'800',color:colors.ink},link:{fontSize:13,fontWeight:'700',color:colors.blue},emptyTitle:{fontSize:17,fontWeight:'800',color:colors.ink},emptyText:{fontSize:14,lineHeight:20,color:colors.muted,marginTop:5},row:{minHeight:74,paddingHorizontal:14,paddingVertical:12,flexDirection:'row',alignItems:'center',gap:11},rowBorder:{borderTopWidth:1,borderTopColor:colors.line},docIcon:{width:34,height:34,borderRadius:10,backgroundColor:colors.blueSoft,alignItems:'center',justifyContent:'center'},docIconText:{fontSize:13,fontWeight:'900',color:colors.blue},rowTitle:{fontSize:14,fontWeight:'700',color:colors.ink},rowMeta:{fontSize:11.5,color:colors.muted,marginTop:4},amount:{fontSize:13,fontWeight:'800',color:colors.ink}});

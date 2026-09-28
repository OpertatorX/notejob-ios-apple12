import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { AppData, Client, DocumentKind, LineItem, QuoteDocument } from '../types';
import { addDays, calculateTotals, clampPct, formatMoney, isoDate, nextDocumentNumber, uid } from '../domain';
import { localeFor, tr } from '../i18n';
import { Card, Field, PrimaryButton, SecondaryButton, ScreenTitle } from '../ui';
import { colors } from '../theme';

function makeDraft(data:AppData,kind:DocumentKind,existing?:QuoteDocument,clientId?:string,serviceId?:string):QuoteDocument{
  if(existing) return JSON.parse(JSON.stringify(existing));
  const c=clientId?data.clients.find(x=>x.id===clientId):undefined; const issue=isoDate();
  const service=serviceId?data.services.find(x=>x.id===serviceId):undefined;
  const firstItem=service?{id:uid('line'),title:service.title,details:service.details,quantity:1,rate:service.rate}:{id:uid('line'),title:'',details:'',quantity:1,rate:0};
  return {id:uid('doc'),kind,number:nextDocumentNumber(kind,data.documents,data.counters[kind]),clientId:c?.id??null,client:{name:c?.name??'',email:c?.email??'',phone:c?.phone??'',address:c?.address??''},items:[firstItem],discountPct:0,taxPct:data.business.defaultTaxPct,depositPct:0,issueDate:issue,dueDate:addDays(issue,30),notes:kind==='estimate'?(data.business.language==='fr'?'Ce devis est valable 30 jours.':'This estimate is valid for 30 days.'):(data.business.language==='fr'?'Merci pour votre confiance.':'Thank you for your business.'),status:'draft',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
}

function validIsoDate(value:string):boolean{
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date=new Date(`${value}T12:00:00`);
  return !Number.isNaN(date.getTime()) && isoDate(date)===value;
}

export function DocumentEditorScreen({ data, kind, existing, clientId, serviceId, onBack, onSave, onNeedPro }: { data:AppData; kind:DocumentKind; existing?:QuoteDocument; clientId?:string; serviceId?:string; onBack:()=>void; onSave:(doc:QuoteDocument,client:Client,isNew:boolean)=>void; onNeedPro:()=>void }) {
  const [doc,setDoc]=useState(()=>makeDraft(data,kind,existing,clientId,serviceId)); const lang=data.business.language; const isNew=!existing;
  const totals=useMemo(()=>calculateTotals(doc),[doc]); const locale=localeFor(lang);
  const recentClients=useMemo(()=>data.clients.slice(0,6),[data.clients]);
  const recentServices=useMemo(()=>[...data.services].sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)).slice(0,8),[data.services]);
  const setClient=(key:keyof QuoteDocument['client'],value:string)=>setDoc(d=>({...d,client:{...d.client,[key]:value}}));
  const selectClient=(client:Client)=>setDoc(d=>({...d,clientId:client.id,client:{name:client.name,email:client.email,phone:client.phone,address:client.address}}));
  const updateLine=(id:string,patch:Partial<LineItem>)=>setDoc(d=>({...d,items:d.items.map(i=>i.id===id?{...i,...patch}:i)}));
  const addService=(service:{title:string;details:string;rate:number})=>setDoc(d=>{
    const first=d.items[0];
    const line={id:uid('line'),title:service.title,details:service.details,quantity:1,rate:service.rate};
    if(d.items.length===1&&!first.title.trim()&&!first.details.trim()&&first.rate===0) return {...d,items:[{...line,id:first.id}]};
    return {...d,items:[...d.items,line]};
  });
  const save=()=>{
    if(!doc.client.name.trim()){Alert.alert('OX Invoice',lang==='fr'?'Ajoutez un nom de client.':'Add a client name.');return;}
    if(!doc.items.some(i=>i.title.trim()&&i.quantity>0)){Alert.alert('OX Invoice',lang==='fr'?'Ajoutez au moins une prestation.':'Add at least one line item.');return;}
    if(!validIsoDate(doc.issueDate)||!validIsoDate(doc.dueDate)){Alert.alert('OX Invoice',lang==='fr'?'Utilisez des dates valides au format AAAA-MM-JJ.':'Use valid dates in YYYY-MM-DD format.');return;}
    if(doc.dueDate < doc.issueDate){Alert.alert('OX Invoice',lang==='fr'?'La date d’échéance ou de validité doit être postérieure ou égale à la date d’émission.':'The due or validity date must be on or after the issue date.');return;}
    if(isNew && !data.proEntitled && data.freeDocumentsCreated>=3){onNeedPro();return;}
    const existingClient=data.clients.find(c=>c.id===doc.clientId)||data.clients.find(c=>c.email&&c.email.toLowerCase()===doc.client.email.toLowerCase()&&doc.client.email);
    const snapshot={name:doc.client.name.trim(),email:doc.client.email.trim(),phone:doc.client.phone.trim(),address:doc.client.address.trim()};
    const client:Client=existingClient?{...existingClient,...snapshot}:{id:uid('client'),...snapshot,createdAt:new Date().toISOString()};
    const finalDoc:QuoteDocument={...doc,clientId:client.id,client:snapshot,items:doc.items.map(i=>({...i,title:i.title.trim(),details:i.details.trim(),quantity:Math.max(0,Number(i.quantity)||0),rate:Math.max(0,Number(i.rate)||0)})),discountPct:clampPct(doc.discountPct),taxPct:clampPct(doc.taxPct),depositPct:clampPct(doc.depositPct),updatedAt:new Date().toISOString()};
    onSave(finalDoc,client,isNew);
  };
  return <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <ScreenTitle eyebrow={doc.number} title={doc.kind==='estimate'?tr(lang,'createEstimate'):tr(lang,'createInvoice')} action={<SecondaryButton compact title="‹" onPress={onBack}/>}/>
    <Card style={styles.card}><Text style={styles.section}>{tr(lang,'client')}</Text>{recentClients.length?<><Text style={styles.quickLabel}>{tr(lang,'recentClients')}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickRow}>{recentClients.map(c=><Pressable key={c.id} onPress={()=>selectClient(c)} style={[styles.quickChip,doc.clientId===c.id&&styles.quickChipActive]}><Text numberOfLines={1} style={[styles.quickChipText,doc.clientId===c.id&&styles.quickChipTextActive]}>{c.name}</Text></Pressable>)}</ScrollView></>:null}<Field label={tr(lang,'clientName')} value={doc.client.name} onChangeText={v=>setClient('name',v)} placeholder={lang==='fr'?'Nom du client':'Client name'}/><Field label={tr(lang,'email')} value={doc.client.email} onChangeText={v=>setClient('email',v)} keyboardType="email-address"/><Field label={tr(lang,'phone')} value={doc.client.phone} onChangeText={v=>setClient('phone',v)} keyboardType="phone-pad"/><Field label={tr(lang,'address')} value={doc.client.address} onChangeText={v=>setClient('address',v)} multiline/></Card>
    <Card style={styles.card}><View style={styles.sectionRow}><Text style={styles.section}>{tr(lang,'lineItems')}</Text><Pressable onPress={()=>setDoc(d=>({...d,items:[...d.items,{id:uid('line'),title:'',details:'',quantity:1,rate:0}]}))}><Text style={styles.add}>{`＋ ${tr(lang,'addItem')}`}</Text></Pressable></View>{recentServices.length?<><Text style={styles.quickLabel}>{tr(lang,'recentServices')}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickRow}>{recentServices.map((service,index)=><Pressable key={`${service.id}-${index}`} onPress={()=>addService(service)} style={styles.serviceChip}><Text numberOfLines={1} style={styles.serviceTitle}>{service.title}</Text><Text style={styles.serviceRate}>{formatMoney(service.rate,data.business.currency,locale)}</Text></Pressable>)}</ScrollView></>:null}{doc.items.map((item,index)=><View key={item.id} style={[styles.item,index>0&&styles.itemBorder]}><Field label={`${tr(lang,'itemTitle')} ${index+1}`} value={item.title} onChangeText={title=>updateLine(item.id,{title})}/><Field label={tr(lang,'itemDetails')} value={item.details} onChangeText={details=>updateLine(item.id,{details})}/><View style={styles.two}><View style={{flex:1}}><Field label={tr(lang,'quantity')} value={String(item.quantity)} onChangeText={v=>updateLine(item.id,{quantity:Number(v.replace(',','.'))||0})} keyboardType="decimal-pad"/></View><View style={{flex:1}}><Field label={tr(lang,'rate')} value={String(item.rate||'')} onChangeText={v=>updateLine(item.id,{rate:Number(v.replace(',','.'))||0})} keyboardType="decimal-pad" suffix={data.business.currency}/></View></View>{doc.items.length>1?<Pressable onPress={()=>setDoc(d=>({...d,items:d.items.filter(x=>x.id!==item.id)}))}><Text style={styles.remove}>{lang==='fr'?'Supprimer la ligne':'Remove item'}</Text></Pressable>:null}</View>)}</Card>
    <Card style={styles.card}><View style={styles.two}><View style={{flex:1}}><Field label={tr(lang,'issueDate')} value={doc.issueDate} onChangeText={issueDate=>setDoc(d=>({...d,issueDate}))} placeholder="YYYY-MM-DD"/></View><View style={{flex:1}}><Field label={tr(lang,'dueDate')} value={doc.dueDate} onChangeText={dueDate=>setDoc(d=>({...d,dueDate}))} placeholder="YYYY-MM-DD"/></View></View><View style={styles.two}><View style={{flex:1}}><Field label={tr(lang,'discount')} value={String(doc.discountPct)} onChangeText={v=>setDoc(d=>({...d,discountPct:Number(v.replace(',','.'))||0}))} keyboardType="decimal-pad" suffix="%"/></View><View style={{flex:1}}><Field label={tr(lang,'tax')} value={String(doc.taxPct)} onChangeText={v=>setDoc(d=>({...d,taxPct:Number(v.replace(',','.'))||0}))} keyboardType="decimal-pad" suffix="%"/></View></View><Field label={tr(lang,'deposit')} value={String(doc.depositPct)} onChangeText={v=>setDoc(d=>({...d,depositPct:Number(v.replace(',','.'))||0}))} keyboardType="decimal-pad" suffix="%"/><Field label={tr(lang,'notes')} value={doc.notes} onChangeText={notes=>setDoc(d=>({...d,notes}))} multiline/></Card>
    <Card style={styles.totalCard}><View style={styles.totalRow}><Text style={styles.totalLabel}>{tr(lang,'total')}</Text><Text style={styles.totalValue}>{formatMoney(totals.total,data.business.currency,locale)}</Text></View>{doc.depositPct>0?<View style={styles.balanceRow}><Text>{tr(lang,'balance')}</Text><Text style={{fontWeight:'800'}}>{formatMoney(totals.balance,data.business.currency,locale)}</Text></View>:null}</Card>
    <PrimaryButton title={tr(lang,'save')} onPress={save}/>
  </ScrollView>
}
const styles=StyleSheet.create({content:{padding:20,paddingBottom:50,maxWidth:720,width:'100%',alignSelf:'center',gap:14},card:{gap:13},section:{fontSize:16,fontWeight:'900',color:colors.ink},sectionRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},add:{fontSize:12,fontWeight:'800',color:colors.blue},quickLabel:{fontSize:10.5,fontWeight:'800',textTransform:'uppercase',letterSpacing:.8,color:colors.faint},quickRow:{gap:8,paddingRight:5},quickChip:{maxWidth:170,borderWidth:1,borderColor:colors.line,borderRadius:10,paddingHorizontal:11,paddingVertical:8,backgroundColor:colors.bg},quickChipActive:{backgroundColor:colors.navy,borderColor:colors.navy},quickChipText:{fontSize:12,fontWeight:'700',color:colors.ink},quickChipTextActive:{color:'#fff'},serviceChip:{width:154,borderWidth:1,borderColor:colors.line,borderRadius:10,padding:10,backgroundColor:colors.bg},serviceTitle:{fontSize:11.5,fontWeight:'800',color:colors.ink},serviceRate:{fontSize:10.5,color:colors.muted,marginTop:4},item:{gap:10},itemBorder:{borderTopWidth:1,borderTopColor:colors.line,paddingTop:14,marginTop:2},two:{flexDirection:'row',gap:10},remove:{fontSize:12,fontWeight:'700',color:colors.red},totalCard:{backgroundColor:'#F9FAFB'},totalRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},totalLabel:{fontSize:13,fontWeight:'700',color:colors.muted},totalValue:{fontSize:26,fontWeight:'900',color:colors.ink,letterSpacing:-.5},balanceRow:{flexDirection:'row',justifyContent:'space-between',marginTop:8}});

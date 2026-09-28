import React, { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { BusinessProfile, Currency, Language, PdfTemplate } from '../types';
import { tr } from '../i18n';
import { Card, Field, PrimaryButton, SecondaryButton, ScreenTitle } from '../ui';
import { colors } from '../theme';
import { clampPct } from '../domain';

function TemplateChoice({value,current,label,onPress}:{value:PdfTemplate;current:PdfTemplate;label:string;onPress:()=>void}){
  const active=value===current;
  return <Pressable onPress={onPress} style={[styles.template,active&&styles.templateActive]}>
    <View style={[styles.templatePage,value==='modern'&&{paddingTop:0}]}>
      {value==='modern'?<View style={styles.templateBand}/>:null}
      <View style={styles.templateTop}><View style={styles.miniLogo}/><View style={styles.miniTitle}/></View>
      <View style={styles.miniParties}><View style={styles.miniCol}/><View style={styles.miniCol}/></View>
      <View style={[styles.miniTable,value==='minimal'&&{backgroundColor:'#fff',borderTopWidth:1,borderBottomWidth:1,borderColor:colors.line}]}/>
      <View style={styles.miniLine}/><View style={styles.miniLine}/><View style={styles.miniTotal}/>
    </View>
    <Text style={[styles.templateLabel,active&&styles.templateLabelActive]}>{label}</Text>
  </Pressable>;
}

export function BusinessScreen({ business, onSave, onBack }: { business:BusinessProfile; onSave:(value:BusinessProfile)=>void; onBack:()=>void }) {
  const [draft,setDraft]=useState(business); const lang=draft.language;
  const logoUri=draft.logoDataUri;
  const pickLogo=async()=>{
    const permission=await ImagePicker.requestMediaLibraryPermissionsAsync();
    if(!permission.granted){Alert.alert('OX Invoice',lang==='fr'?'Accès aux photos requis pour choisir votre logo.':'Photo access is required to choose your logo.');return;}
    const result=await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],allowsEditing:true,aspect:[3,1],quality:.85,base64:true});
    if(!result.canceled){const a=result.assets[0]; if(a.base64){const mime=a.mimeType||'image/jpeg';setDraft(v=>({...v,logoDataUri:`data:${mime};base64,${a.base64}`}));}}
  };
  const select=<T extends string>(values:readonly T[],current:T,set:(v:T)=>void)=><View style={styles.choiceRow}>{values.map(v=><Pressable key={v} onPress={()=>set(v)} style={[styles.choice,current===v&&styles.choiceActive]}><Text style={[styles.choiceText,current===v&&styles.choiceTextActive]}>{v}</Text></Pressable>)}</View>;
  const templateNames:Record<PdfTemplate,string>=lang==='fr'?{classic:'Classique',modern:'Moderne',minimal:'Minimal'}:{classic:'Classic',modern:'Modern',minimal:'Minimal'};
  const save=()=>{
    if(!draft.name.trim()){Alert.alert('OX Invoice',lang==='fr'?'Ajoutez le nom de votre entreprise.':'Add your business name.');return;}
    onSave({...draft,name:draft.name.trim(),email:draft.email.trim(),phone:draft.phone.trim(),address:draft.address.trim(),taxId:draft.taxId.trim(),website:draft.website.trim(),paymentDetails:draft.paymentDetails.trim(),defaultTaxPct:clampPct(draft.defaultTaxPct)});
    onBack();
  };
  return <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <ScreenTitle eyebrow="OX Invoice" title={tr(lang,'business')} action={<SecondaryButton compact title="‹" onPress={onBack}/>}/>
    <Card style={styles.form}>
      <View style={styles.logoRow}><View style={styles.logoBox}>{logoUri?<Image source={{uri:logoUri}} resizeMode="contain" style={styles.logo}/>:<Text style={styles.logoLetter}>OX</Text>}</View><View style={{gap:8,flex:1}}><SecondaryButton compact title={tr(lang,'chooseLogo')} onPress={pickLogo}/>{draft.logoDataUri?<Pressable onPress={()=>setDraft(v=>({...v,logoDataUri:null}))}><Text style={styles.remove}>{tr(lang,'removeLogo')}</Text></Pressable>:null}</View></View>
      <Field label={tr(lang,'businessName')} value={draft.name} onChangeText={name=>setDraft(v=>({...v,name}))} placeholder={lang==='fr'?'Nom de votre entreprise':'Your business name'}/>
      <Field label={tr(lang,'email')} value={draft.email} onChangeText={email=>setDraft(v=>({...v,email}))} keyboardType="email-address" placeholder={lang==='fr'?'contact@entreprise.fr':'hello@business.com'}/>
      <Field label={tr(lang,'phone')} value={draft.phone} onChangeText={phone=>setDraft(v=>({...v,phone}))} keyboardType="phone-pad"/>
      <Field label={tr(lang,'address')} value={draft.address} onChangeText={address=>setDraft(v=>({...v,address}))} multiline/>
      <Field label={tr(lang,'taxId')} value={draft.taxId} onChangeText={taxId=>setDraft(v=>({...v,taxId}))}/>
      <Field label={tr(lang,'website')} value={draft.website} onChangeText={website=>setDraft(v=>({...v,website}))} keyboardType="url"/>
      <Field label={tr(lang,'paymentDetails')} value={draft.paymentDetails} onChangeText={paymentDetails=>setDraft(v=>({...v,paymentDetails}))} multiline placeholder={lang==='fr'?'IBAN, lien de paiement ou instructions de règlement':'IBAN, payment link or payment instructions'}/>
      <Text style={styles.sectionLabel}>{tr(lang,'language')}</Text>{select<Language>(['fr','en'],draft.language,language=>setDraft(v=>({...v,language})))}
      <Text style={styles.sectionLabel}>{tr(lang,'currency')}</Text>{select<Currency>(['EUR','USD','GBP','CHF'],draft.currency,currency=>setDraft(v=>({...v,currency})))}
      <Field label={tr(lang,'defaultTax')} value={String(draft.defaultTaxPct)} onChangeText={x=>setDraft(v=>({...v,defaultTaxPct:Number(x.replace(',','.'))||0}))} keyboardType="decimal-pad" suffix="%"/>
      <Text style={styles.sectionLabel}>{tr(lang,'pdfStyle')}</Text>
      <View style={styles.templateRow}>{(['classic','modern','minimal'] as const).map(value=><TemplateChoice key={value} value={value} current={draft.pdfTemplate} label={templateNames[value]} onPress={()=>setDraft(v=>({...v,pdfTemplate:value}))}/>)}</View>
      <PrimaryButton title={tr(lang,'save')} onPress={save}/>
    </Card>
  </ScrollView>
}
const styles=StyleSheet.create({content:{padding:20,paddingBottom:50,maxWidth:720,width:'100%',alignSelf:'center'},form:{gap:15},logoRow:{flexDirection:'row',alignItems:'center',gap:14},logoBox:{width:92,height:62,borderWidth:1,borderColor:colors.line,borderRadius:12,backgroundColor:colors.bg,alignItems:'center',justifyContent:'center',overflow:'hidden'},logo:{width:82,height:52},logoLetter:{fontSize:20,fontWeight:'900',letterSpacing:-.8,color:colors.navy},remove:{fontSize:12,fontWeight:'700',color:colors.red,textAlign:'center'},sectionLabel:{fontSize:12,fontWeight:'700',color:'#475467',marginBottom:-7},choiceRow:{flexDirection:'row',flexWrap:'wrap',gap:8},choice:{borderWidth:1,borderColor:'#D0D5DD',borderRadius:10,paddingHorizontal:13,paddingVertical:9,backgroundColor:'#fff'},choiceActive:{backgroundColor:colors.navy,borderColor:colors.navy},choiceText:{fontSize:12,fontWeight:'700',color:colors.muted},choiceTextActive:{color:'#fff'},templateRow:{flexDirection:'row',gap:8},template:{flex:1,borderWidth:1,borderColor:colors.line,borderRadius:12,padding:8,backgroundColor:colors.bg},templateActive:{borderColor:colors.navy,borderWidth:2,backgroundColor:'#F8FAFC'},templatePage:{height:88,backgroundColor:'#fff',borderRadius:5,padding:7,overflow:'hidden',borderWidth:1,borderColor:'#EEF0F3'},templateBand:{height:17,backgroundColor:colors.navy,marginHorizontal:-7,marginBottom:6},templateTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},miniLogo:{width:13,height:13,borderRadius:3,backgroundColor:colors.navy},miniTitle:{width:27,height:5,borderRadius:3,backgroundColor:'#98A2B3'},miniParties:{flexDirection:'row',gap:7,marginTop:10},miniCol:{height:12,flex:1,borderRadius:2,backgroundColor:'#E9EDF2'},miniTable:{height:7,borderRadius:1,backgroundColor:'#E9EDF2',marginTop:9},miniLine:{height:1,backgroundColor:'#E5E7EB',marginTop:7},miniTotal:{width:31,height:8,borderRadius:2,backgroundColor:'#E6ECF2',alignSelf:'flex-end',marginTop:7},templateLabel:{fontSize:10.5,fontWeight:'800',color:colors.muted,textAlign:'center',marginTop:7},templateLabelActive:{color:colors.navy}});

import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { AppData, Client } from '../types';
import { Card, ScreenTitle } from '../ui';
import { colors, radii } from '../theme';

export function ClientsScreen({ data, onNewInvoice, onDelete }: { data:AppData; onNewInvoice:(clientId:string)=>void; onDelete:(clientId:string)=>void }) {
  const lang=data.business.language;
  const [query,setQuery]=useState('');
  const clients=useMemo(()=>data.clients.filter(c=>`${c.name} ${c.email} ${c.phone} ${c.address}`.toLowerCase().includes(query.trim().toLowerCase())),[data.clients,query]);
  const remove=(client:Client)=>Alert.alert('OX Invoice',lang==='fr'?`Retirer « ${client.name} » de vos clients ?`:`Remove “${client.name}” from saved clients?`,[
    {text:lang==='fr'?'Annuler':'Cancel',style:'cancel'},
    {text:lang==='fr'?'Retirer':'Remove',style:'destructive',onPress:()=>onDelete(client.id)},
  ]);
  return <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <ScreenTitle title="Clients" />
    <View style={styles.search}><TextInput value={query} onChangeText={setQuery} placeholder={lang==='fr'?'Rechercher un client…':'Search clients…'} placeholderTextColor={colors.faint} style={styles.searchInput}/></View>
    {clients.length===0?<Card><Text style={styles.emptyTitle}>{data.clients.length===0?(lang==='fr'?'Aucun client enregistré':'No saved clients'):(lang==='fr'?'Aucun résultat':'No results')}</Text><Text style={styles.emptyText}>{data.clients.length===0?(lang==='fr'?'Les clients sont enregistrés automatiquement quand vous créez un document.':'Clients are saved automatically when you create a document.'):(lang==='fr'?'Essayez une autre recherche.':'Try another search.')}</Text></Card>:<Card style={{padding:0}}>{clients.map((c,i)=>{const count=data.documents.filter(d=>d.clientId===c.id).length;return <Pressable key={c.id} onPress={()=>onNewInvoice(c.id)} onLongPress={()=>remove(c)} delayLongPress={450} style={[styles.row,i>0&&styles.border]}><View style={styles.avatar}><Text style={styles.avatarText}>{c.name.slice(0,2).toUpperCase()}</Text></View><View style={{flex:1,minWidth:0}}><Text numberOfLines={1} style={styles.name}>{c.name}</Text><Text numberOfLines={1} style={styles.meta}>{c.email||c.phone||c.address||'—'}</Text></View><Text style={styles.count}>{count} {lang==='fr'?'doc.':'docs'}</Text></Pressable>})}</Card>}
    {clients.length>0?<Text style={styles.hint}>{lang==='fr'?'Touchez un client pour créer une facture. Appui long pour le retirer de la liste.':'Tap a client to create an invoice. Long-press to remove it from the list.'}</Text>:null}
  </ScrollView>;
}
const styles=StyleSheet.create({content:{padding:20,paddingBottom:110,maxWidth:720,width:'100%',alignSelf:'center',gap:12},search:{borderWidth:1,borderColor:colors.line,borderRadius:radii.md,backgroundColor:'#fff'},searchInput:{paddingHorizontal:14,paddingVertical:12,fontSize:14,color:colors.ink},emptyTitle:{fontSize:16,fontWeight:'800',color:colors.ink},emptyText:{fontSize:14,lineHeight:20,color:colors.muted,marginTop:5},row:{padding:14,flexDirection:'row',alignItems:'center',gap:12,minHeight:70},border:{borderTopWidth:1,borderTopColor:colors.line},avatar:{width:38,height:38,borderRadius:12,backgroundColor:colors.soft,alignItems:'center',justifyContent:'center'},avatarText:{fontSize:12,fontWeight:'900',color:colors.navy},name:{fontSize:14,fontWeight:'800',color:colors.ink},meta:{fontSize:11.5,color:colors.muted,marginTop:4},count:{fontSize:11.5,fontWeight:'700',color:colors.muted},hint:{fontSize:11.5,color:colors.faint,textAlign:'center',marginTop:4}});

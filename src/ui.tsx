import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radii, shadow } from './theme';

export function ScreenTitle({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: React.ReactNode }) {
  return <View style={styles.titleRow}><View style={{flex:1}}>{eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}<Text style={styles.title}>{title}</Text></View>{action}</View>;
}

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function PrimaryButton({ title, onPress, disabled=false, compact=false }: { title:string; onPress:()=>void; disabled?:boolean; compact?:boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityState={{disabled}} onPress={onPress} disabled={disabled} style={({pressed}: {pressed:boolean}) => [styles.primary, compact && styles.compact, disabled && styles.disabled, pressed && !disabled && {opacity:.85}]}><Text style={styles.primaryText}>{title}</Text></Pressable>;
}

export function SecondaryButton({ title, onPress, disabled=false, compact=false }: { title:string; onPress:()=>void; disabled?:boolean; compact?:boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityState={{disabled}} onPress={onPress} disabled={disabled} style={({pressed}: {pressed:boolean}) => [styles.secondary, compact && styles.compact, disabled && styles.disabled, pressed && !disabled && {opacity:.75}]}><Text style={styles.secondaryText}>{title}</Text></Pressable>;
}

export function Field({ label, value, onChangeText, placeholder, keyboardType='default', multiline=false, suffix }: { label:string; value:string; onChangeText:(v:string)=>void; placeholder?:string; keyboardType?:TextInputProps['keyboardType']; multiline?:boolean; suffix?:string }) {
  return <View style={styles.fieldWrap}><Text style={styles.label}>{label}</Text><View style={styles.inputWrap}><TextInput accessibilityLabel={label} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.faint} keyboardType={keyboardType} multiline={multiline} style={[styles.input, multiline && {minHeight:74,textAlignVertical:'top'}]} />{suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}</View></View>;
}

export function Pill({ text, tone='neutral' }: { text:string; tone?:'neutral'|'green'|'red'|'blue'|'amber' }) {
  const map = {neutral:[colors.soft,colors.muted],green:[colors.greenSoft,colors.green],red:[colors.redSoft,colors.red],blue:[colors.blueSoft,colors.blue],amber:[colors.amberSoft,colors.amber]} as const;
  return <View style={[styles.pill,{backgroundColor:map[tone][0]}]}><Text style={[styles.pillText,{color:map[tone][1]}]}>{text}</Text></View>;
}

export function Divider(){ return <View style={styles.divider}/>; }

export function Metric({ label, value, tone='neutral' }: { label:string; value:string; tone?:'neutral'|'green'|'red'|'blue'|'amber' }) {
  const ink = tone==='green'?colors.green:tone==='red'?colors.red:tone==='blue'?colors.blue:tone==='amber'?colors.amber:colors.ink;
  return <View style={styles.metric}><Text style={[styles.metricValue,{color:ink}]}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>;
}

const styles=StyleSheet.create({
  titleRow:{flexDirection:'row',alignItems:'center',gap:12,marginBottom:18},eyebrow:{fontSize:11,fontWeight:'700',letterSpacing:1.5,textTransform:'uppercase',color:colors.faint,marginBottom:5},title:{fontSize:29,lineHeight:34,fontWeight:'800',letterSpacing:-.7,color:colors.ink},
  card:{backgroundColor:colors.surface,borderRadius:radii.lg,borderWidth:1,borderColor:colors.line,padding:16,...shadow},
  primary:{minHeight:48,borderRadius:radii.md,backgroundColor:colors.navy,alignItems:'center',justifyContent:'center',paddingHorizontal:18},secondary:{minHeight:48,borderRadius:radii.md,backgroundColor:colors.surface,borderWidth:1,borderColor:'#D0D5DD',alignItems:'center',justifyContent:'center',paddingHorizontal:18},compact:{minHeight:38,paddingHorizontal:14},disabled:{opacity:.45},primaryText:{color:'#fff',fontSize:15,fontWeight:'700'},secondaryText:{color:colors.ink,fontSize:15,fontWeight:'700'},
  fieldWrap:{gap:7},label:{fontSize:12,fontWeight:'700',color:'#475467'},inputWrap:{minHeight:46,borderWidth:1,borderColor:'#D0D5DD',borderRadius:radii.md,backgroundColor:'#fff',flexDirection:'row',alignItems:'center',paddingHorizontal:12},input:{flex:1,fontSize:15,color:colors.ink,paddingVertical:11},suffix:{fontSize:13,color:colors.muted,fontWeight:'600'},
  pill:{borderRadius:999,paddingHorizontal:9,paddingVertical:5,alignSelf:'flex-start'},pillText:{fontSize:11,fontWeight:'700'},divider:{height:1,backgroundColor:colors.line},
  metric:{minWidth:150,flex:1,flexBasis:'47%',padding:14,borderRadius:radii.md,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.line},metricValue:{fontSize:20,fontWeight:'800',letterSpacing:-.4},metricLabel:{fontSize:11,color:colors.muted,marginTop:4,fontWeight:'600'},
});

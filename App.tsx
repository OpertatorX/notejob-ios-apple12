import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { AppData, Client, DocumentKind, QuoteDocument } from './src/types';
import { nextDocumentNumber, uid, isoDate, addDays, canCreateDocument, resetBusinessData } from './src/domain';
import { loadAppData, saveAppData } from './src/storage';
import { PurchaseProvider, usePurchases } from './src/purchases';
import { HomeScreen } from './src/screens/HomeScreen';
import { DocumentsScreen } from './src/screens/DocumentsScreen';
import { ClientsScreen } from './src/screens/ClientsScreen';
import { ServicesScreen } from './src/screens/ServicesScreen';
import { MoreScreen } from './src/screens/MoreScreen';
import { BusinessScreen } from './src/screens/BusinessScreen';
import { DocumentEditorScreen } from './src/screens/DocumentEditorScreen';
import { PreviewScreen } from './src/screens/PreviewScreen';
import { PaywallScreen } from './src/screens/PaywallScreen';
import { colors, shadow } from './src/theme';
import { tr } from './src/i18n';

type Tab = 'home' | 'clients' | 'services' | 'documents' | 'more';
type Route =
  | { type: 'tab'; tab: Tab }
  | { type: 'business'; returnTo?: Route }
  | { type: 'paywall'; returnTo?: Route }
  | { type: 'editor'; kind: DocumentKind; id?: string; clientId?: string; serviceId?: string }
  | { type: 'preview'; id: string };

function quoteDocumentCopy(source: QuoteDocument, data: AppData, kind = source.kind): QuoteDocument {
  const today = isoDate();
  return {
    ...JSON.parse(JSON.stringify(source)),
    id: uid('doc'),
    kind,
    number: nextDocumentNumber(kind, data.documents, data.counters[kind]),
    status: 'draft',
    issueDate: today,
    dueDate: addDays(today, 30),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function MainApp({ externalEntitlement }: { externalEntitlement: boolean | null }) {
  const [data, setData] = useState<AppData | null>(null);
  const [route, setRoute] = useState<Route>({ type: 'tab', tab: 'home' });
  const [loaded, setLoaded] = useState(false);
  const { restore } = usePurchases();

  useEffect(() => {
    let alive = true;
    void loadAppData().then(value => {
      if (!alive) return;
      setData(value);
      setLoaded(true);
    });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!loaded || !data) return;
    void saveAppData(data);
  }, [data, loaded]);

  useEffect(() => {
    if (!loaded || externalEntitlement === null) return;
    setData(current => {
      if (!current || current.proEntitled === externalEntitlement) return current;
      return {...current, proEntitled: externalEntitlement, entitlementCheckedAt: new Date().toISOString()};
    });
    if (externalEntitlement) {
      setRoute(current => current.type === 'paywall' ? (current.returnTo ?? {type:'tab',tab:'more'}) : current);
    }
  }, [externalEntitlement, loaded]);

  const openPaywall = useCallback((returnTo?: Route) => setRoute({ type: 'paywall', returnTo }), []);

  if (!data || !loaded) {
    return <SafeAreaView style={styles.root}><StatusBar barStyle="dark-content"/><View style={styles.loading}><Image source={require('./assets/icon.png')} style={styles.loadingIcon}/><Text style={styles.loadingTitle}>OX Invoice</Text><ActivityIndicator color={colors.navy} style={{marginTop:18}}/></View></SafeAreaView>;
  }

  const beginCreate = (kind: DocumentKind, clientId?: string, serviceId?: string) => {
    const next: Route = { type: 'editor', kind, clientId, serviceId };
    if (!data.business.name.trim()) { setRoute({ type: 'business', returnTo: next }); return; }
    if (!canCreateDocument(data)) { openPaywall(next); return; }
    setRoute(next);
  };

  const saveDocument = (doc: QuoteDocument, client: Client, isNew: boolean) => {
    setData(current => {
      if (!current) return current;
      const clients = current.clients.some(c => c.id === client.id)
        ? current.clients.map(c => c.id === client.id ? client : c)
        : [client, ...current.clients];
      const documents = current.documents.some(d => d.id === doc.id)
        ? current.documents.map(d => d.id === doc.id ? doc : d)
        : [doc, ...current.documents];
      const now = new Date().toISOString();
      const services = [...current.services];
      for (const item of doc.items) {
        const title=item.title.trim();
        if (!title) continue;
        const details=item.details.trim();
        const rate=Math.max(0,Number(item.rate)||0);
        const idx=services.findIndex(s=>s.title.trim().toLowerCase()===title.toLowerCase() && s.details.trim().toLowerCase()===details.toLowerCase() && Math.abs(s.rate-rate)<0.001);
        if (idx>=0) services[idx]={...services[idx],title,details,rate,updatedAt:now};
        else services.unshift({id:uid('service'),title,details,rate,createdAt:now,updatedAt:now});
      }
      return {
        ...current,
        clients,
        services,
        documents,
        freeDocumentsCreated: isNew ? current.freeDocumentsCreated + 1 : current.freeDocumentsCreated,
        counters: isNew ? {...current.counters, [doc.kind]: current.counters[doc.kind] + 1} : current.counters,
      };
    });
    setRoute({ type: 'preview', id: doc.id });
  };

  const updateDocument = (doc: QuoteDocument) => {
    setData(current => current ? ({...current, documents: current.documents.map(d => d.id === doc.id ? doc : d)}) : current);
  };

  const duplicateDocument = (doc: QuoteDocument) => {
    if (!canCreateDocument(data)) { openPaywall({ type: 'preview', id: doc.id }); return; }
    const copy = quoteDocumentCopy(doc, data);
    setData(current => current ? ({
      ...current,
      documents: [copy, ...current.documents],
      freeDocumentsCreated: current.freeDocumentsCreated + 1,
      counters: {...current.counters, [copy.kind]: current.counters[copy.kind] + 1},
    }) : current);
    setRoute({ type: 'preview', id: copy.id });
  };

  const convertEstimate = (doc: QuoteDocument) => {
    if (doc.kind !== 'estimate') return;
    if (!canCreateDocument(data)) { openPaywall({ type: 'preview', id: doc.id }); return; }
    const invoice = quoteDocumentCopy(doc, data, 'invoice');
    invoice.notes = data.business.language === 'fr' ? 'Merci pour votre confiance.' : 'Thank you for your business.';
    setData(current => current ? ({
      ...current,
      documents: [invoice, ...current.documents],
      freeDocumentsCreated: current.freeDocumentsCreated + 1,
      counters: {...current.counters, invoice: current.counters.invoice + 1},
    }) : current);
    setRoute({ type: 'preview', id: invoice.id });
  };

  const deleteDocument = (id: string) => {
    setData(current => current ? ({...current, documents: current.documents.filter(d => d.id !== id)}) : current);
    setRoute({ type: 'tab', tab: 'documents' });
  };

  const resetAllData = () => {
    setData(current => current ? resetBusinessData(current) : current);
    setRoute({ type: 'tab', tab: 'home' });
  };

  let content: React.ReactNode;
  const showTabs = route.type === 'tab';

  if (route.type === 'business') {
    content = <BusinessScreen business={data.business} onSave={business => setData(current => current ? ({...current,business}) : current)} onBack={() => setRoute(route.returnTo ?? {type:'tab',tab:'more'})}/>;
  } else if (route.type === 'paywall') {
    content = <PaywallScreen lang={data.business.language} onBack={() => setRoute(route.returnTo ?? {type:'tab',tab:'more'})} onRestored={() => setRoute(route.returnTo ?? {type:'tab',tab:'more'})}/>;
  } else if (route.type === 'editor') {
    const existing = route.id ? data.documents.find(d => d.id === route.id) : undefined;
    content = <DocumentEditorScreen
      key={`${route.kind}:${route.id ?? 'new'}:${route.clientId ?? ''}`}
      data={data}
      kind={route.kind}
      existing={existing}
      clientId={route.clientId}
      serviceId={route.serviceId}
      onBack={() => setRoute(existing ? {type:'preview',id:existing.id} : {type:'tab',tab:'home'})}
      onSave={saveDocument}
      onNeedPro={() => openPaywall(route)}
    />;
  } else if (route.type === 'preview') {
    const doc = data.documents.find(d => d.id === route.id);
    content = doc ? <PreviewScreen
      data={data}
      doc={doc}
      onBack={() => setRoute({type:'tab',tab:'documents'})}
      onEdit={() => setRoute({type:'editor',kind:doc.kind,id:doc.id})}
      onUpdate={updateDocument}
      onDuplicate={() => duplicateDocument(doc)}
      onConvert={doc.kind === 'estimate' ? () => convertEstimate(doc) : undefined}
      onDelete={() => deleteDocument(doc.id)}
    /> : <View style={styles.loading}><Text>Document not found.</Text></View>;
  } else {
    switch (route.tab) {
      case 'documents': content = <DocumentsScreen data={data} onCreate={beginCreate} onOpen={id=>setRoute({type:'preview',id})}/>; break;
      case 'clients': content = <ClientsScreen data={data} onNewInvoice={clientId=>beginCreate('invoice',clientId)} onDelete={id=>setData(current=>current?({...current,clients:current.clients.filter(c=>c.id!==id)}):current)}/>; break;
      case 'services': content = <ServicesScreen data={data} onCreate={(kind,serviceId)=>beginCreate(kind,undefined,serviceId)} onDelete={id=>setData(current=>current?({...current,services:current.services.filter(s=>s.id!==id)}):current)}/>; break;
      case 'more': content = <MoreScreen data={data} onBusiness={()=>setRoute({type:'business',returnTo:route})} onPaywall={()=>openPaywall(route)} onRestore={()=>void restore().then(ok=>Alert.alert('OX Invoice',ok?(data.business.language==='fr'?'Achat restauré.':'Purchase restored.'):(data.business.language==='fr'?'Aucun abonnement actif trouvé.':'No active subscription found.')))} onReset={resetAllData}/>; break;
      default: content = <HomeScreen data={data} onCreate={beginCreate} onOpen={id=>setRoute({type:'preview',id})} onSetupBusiness={()=>setRoute({type:'business',returnTo:route})} onSeeAll={()=>setRoute({type:'tab',tab:'documents'})}/>;
    }
  }

  return <SafeAreaView style={styles.root}>
    <StatusBar barStyle="dark-content"/>
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
      <View style={styles.flex}>{content}</View>
      {showTabs ? <BottomTabs active={route.tab} lang={data.business.language} onChange={tab=>setRoute({type:'tab',tab})}/> : null}
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

function BottomTabs({active,lang,onChange}:{active:Tab;lang:'fr'|'en';onChange:(tab:Tab)=>void}) {
  const tabs: Array<{key:Tab;glyph:string;label:string}> = [
    {key:'home',glyph:'⌂',label:tr(lang,'home')},
    {key:'clients',glyph:'◉',label:tr(lang,'clients')},
    {key:'services',glyph:'◆',label:tr(lang,'services')},
    {key:'documents',glyph:'▤',label:tr(lang,'documents')},
    {key:'more',glyph:'•••',label:tr(lang,'more')},
  ];
  return <View style={styles.tabWrap}><View style={styles.tabs}>{tabs.map(t=>{
    const selected=t.key===active;
    return <Pressable key={t.key} accessibilityRole="button" accessibilityLabel={t.label} accessibilityState={{selected}} onPress={()=>onChange(t.key)} style={styles.tab}><Text style={[styles.tabGlyph,selected&&styles.tabSelected]}>{t.glyph}</Text><Text numberOfLines={1} style={[styles.tabLabel,selected&&styles.tabSelected]}>{t.label}</Text></Pressable>;
  })}</View></View>;
}

export default function App() {
  const [entitlement, setEntitlement] = useState<boolean | null>(null);
  const entitlementHandler = useCallback((active:boolean)=>setEntitlement(active),[]);
  return <PurchaseProvider onEntitlement={entitlementHandler}><MainApp externalEntitlement={entitlement}/></PurchaseProvider>;
}

const styles=StyleSheet.create({
  root:{flex:1,backgroundColor:colors.bg},flex:{flex:1},loading:{flex:1,alignItems:'center',justifyContent:'center',padding:30},loadingIcon:{width:76,height:76,borderRadius:18},loadingTitle:{fontSize:28,fontWeight:'900',letterSpacing:-.8,color:colors.ink,marginTop:12},
  tabWrap:{position:'absolute',left:0,right:0,bottom:0,paddingHorizontal:14,paddingTop:8,paddingBottom:Platform.OS==='ios'?7:10,backgroundColor:'rgba(246,247,249,.97)',borderTopWidth:1,borderTopColor:colors.line},tabs:{height:62,maxWidth:720,width:'100%',alignSelf:'center',flexDirection:'row',backgroundColor:'#fff',borderRadius:20,borderWidth:1,borderColor:colors.line,...shadow},tab:{flex:1,alignItems:'center',justifyContent:'center',gap:3},tabGlyph:{fontSize:18,fontWeight:'900',color:colors.faint},tabLabel:{fontSize:10.5,fontWeight:'700',color:colors.faint},tabSelected:{color:colors.navy},
});

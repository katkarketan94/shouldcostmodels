import sys; sys.path.insert(0,'/tmp/claude-0/xl')
from gen import build
HTK=[('inc','Incomer VCB panel','A'),('fdr','Outgoing feeder VCB panel','A'),('cpl','Bus coupler VCB panel','A'),('mtr','Motor feeder VCB panel','A'),('pt','Bus PT, metering and surge-arrester panel','')]
LTK=[('aci','ACB incomer','A'),('acc','ACB bus coupler','A'),('acf','ACB outgoing feeder','A'),('mcf','MCCB feeder (each)','A'),('dol','MCC starter, DOL','kW'),('sd','MCC starter, star-delta','kW'),('vfd','MCC starter, VFD','kW'),('pf','APFC bank','kVAr')]
HTD={'inc':1250,'fdr':630,'cpl':1250,'mtr':400}; LTD={'aci':2500,'acc':2500,'acf':800,'mcf':250,'dol':15,'sd':55,'vfd':30,'pf':200}
HT_P=[dict(tag='HT-01 11 kV plant board, 13 panels',kv=11,busA=1250,kA=25,ip='IP42',arc='No',relay='Numeric O/C + E/F',q=dict(inc=2,cpl=1,fdr=6,mtr=2,pt=2),a=dict(inc=1250,cpl=1250,fdr=630,mtr=400)),
 dict(tag='HT-02 33 kV main board, 8 panels',kv=33,busA=2000,kA=31.5,ip='IP42',arc='Yes',relay='IED, IEC 61850 + disturbance record',q=dict(inc=2,cpl=1,fdr=4,pt=1),a=dict(inc=2000,cpl=2000,fdr=1250)),
 dict(tag='HT-03 6.6 kV motor board, 10 panels',kv=6.6,busA=1250,kA=40,ip='IP42',arc='No',relay='Numeric O/C + E/F',q=dict(inc=1,fdr=1,mtr=7,pt=1),a=dict(inc=1250,fdr=630,mtr=400))]
LT_P=[dict(tag='LT-01 PCC 3200 A, 2 incomers + coupler',busA=3200,kA=50,ip='IP54',arc='No',form='Form 4b',busMat='Aluminium',q=dict(aci=2,acc=1,acf=4,mcf=12),a=dict(aci=3200,acc=3200,acf=800,mcf=250)),
 dict(tag='LT-02 MCC, 40 starters',busA=1000,kA=50,ip='IP54',arc='No',form='Form 3b',busMat='Copper',q=dict(aci=1,mcf=4,dol=28,sd=6,vfd=6),a=dict(aci=1000,mcf=125,dol=11,sd=55,vfd=30)),
 dict(tag='LT-03 APFC panel 600 kVAr',busA=1000,kA=36,ip='IP42',arc='No',form='Form 2b',busMat='Aluminium',q=dict(aci=1,pf=3),a=dict(aci=1000,pf=200))]
def cfgOf(cls,p):
    K=HTK if cls=='HT' else LTK; D=HTD if cls=='HT' else LTD
    kinds=[(k,l,u,p['q'].get(k,0),p['a'].get(k,D.get(k,0))) for k,l,u in K]
    c=dict(p); c['kinds']=kinds
    notes_ht=[dict(tag=x['tag'],kv=x['kv'],busA=x['busA'],kA=x['kA'],bays=[(k,x['q'].get(k,0),x['a'].get(k,0)) for k,*_ in HTK],note=f"{x['ip']}, arc {x['arc']}, {x['relay']}") for x in HT_P]
    notes_lt=[dict(tag=x['tag'],busA=x['busA'],kA=x['kA'],bays=[(k,x['q'].get(k,0),x['a'].get(k,0)) for k,*_ in LTK],note=f"{x['ip']}, {x['form']}, {x['busMat']} busbar") for x in LT_P]
    c['presets']=notes_ht if cls=='HT' else notes_lt
    return c
if __name__=='__main__':
    import os
    out=sys.argv[1]
    for cls,P in (('HT',HT_P),('LT',LT_P)):
        for i,p in enumerate(P):
            build(cls,cfgOf(cls,p),f'{out}/{cls}_{i}.xlsx')

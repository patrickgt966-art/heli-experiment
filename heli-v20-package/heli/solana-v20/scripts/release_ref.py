"""Python mirror of release::reference_price, used by the SVM tests to state the expected reference."""
def reference(p,now):
 assert p['count']==24
 first=p['next'];last=(first+23)%24
 assert now>=p['times'][last] and now-p['times'][last]<=3600 and p['times'][last]-p['times'][first]>=23*3600
 w=d=0
 for k in range(23):
  i=(first+k)%24;j=(i+1)%24;dt=p['times'][j]-p['times'][i];w+=p['prices'][i]*dt;d+=dt
 return w//d

U=10**6;RATE=4_022_473_737_086_389;S=10**18
def sim(use=1.0,skip=set()):
    st=[70_000_000*U,0,0,15_000_000*U];supply=90_000_000*U
    for n in range(1,721):
        cap=(supply-sum(st))*RATE//S
        mb=min(cap//5,st[3]) if 12<=n<720 else 0
        mr=min(cap-mb,st[0])
        st[0]-=mr
        # management release during window of epoch n (constraints: <=mb, *4<=mr, <=cap/5)
        if n not in skip and mb>0:
            amt=int(mb*use); amt=min(amt,mr//4,st[3]); st[3]-=amt
    free=supply-st[0]-st[3]
    return free/U,(st[0]+st[3])/U
print('full',sim(1.0));print('none',sim(0.0));print('half',sim(0.5));print('skip13-24',sim(1.0,set(range(13,25))))

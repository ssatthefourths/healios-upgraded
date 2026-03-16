import{r as l,s as T,u as ve,V as Se,n as d,j as e,U as oe,M as J,Q as Ne,I as Y,B as A,aG as Te,aH as ke,a6 as re,aI as Ce,aJ as Ee,aK as He,a7 as ae,aB as We,_ as Ae,aL as Le,aM as Me,aN as Re,aO as Ie,aP as Q,aQ as Oe,T as De,C as ne,Y as I,$ as ie,X as _e}from"./index-DJlfIAqU.js";import{A as Fe,a as le}from"./AdminLayout-C0NMKwWL.js";import{S as ce}from"./switch-BZCACN3D.js";import{s as Pe}from"./subMonths-BaMApmd2.js";import{d as Be}from"./differenceInDays-XzFS_EL_.js";import{D as Ye}from"./download-DYlPhBAx.js";import"./shield-PLIfRrQq.js";import"./addMonths-BT3k4R9z.js";const Ve={Champions:"hsl(142, 76%, 36%)","Loyal Customers":"hsl(142, 69%, 58%)","Potential Loyalists":"hsl(200, 98%, 39%)","Recent Customers":"hsl(200, 74%, 60%)",Promising:"hsl(280, 67%, 55%)","Need Attention":"hsl(45, 93%, 47%)","About to Sleep":"hsl(30, 100%, 50%)","At Risk":"hsl(15, 100%, 55%)","Can't Lose Them":"hsl(0, 84%, 60%)",Hibernating:"hsl(0, 0%, 60%)",Lost:"hsl(0, 0%, 40%)"},Ue=(a,i,h)=>a>=4&&i>=4&&h>=4?"Champions":i>=4&&h>=3?"Loyal Customers":a>=4&&i>=2&&i<=4?"Potential Loyalists":a>=4&&i<=2?"Recent Customers":a>=3&&i<=2&&h<=2?"Promising":a>=2&&a<=3&&i>=2&&i<=3&&h>=2&&h<=3?"Need Attention":a<=2&&i<=2?"About to Sleep":a<=2&&i>=3&&h>=3?"At Risk":a<=2&&(i>=4||h>=4)?"Can't Lose Them":a<=2&&i<=2?"Hibernating":a===1&&i===1?"Lost":"Need Attention",X=(a,i)=>a<=i[0]?1:a<=i[1]?2:a<=i[2]?3:a<=i[3]?4:5,$e=(a=12)=>{const[i,h]=l.useState([]),[V,O]=l.useState([]),[v,L]=l.useState(!0);l.useEffect(()=>{_()},[a]);const _=async()=>{L(!0);const k=Pe(new Date,a);try{const{data:x,error:C}=await T.from("orders").select("id, user_id, email, total, created_at, status").gte("created_at",k.toISOString()).in("status",["delivered","shipped","processing"]).order("created_at",{ascending:!1});if(C)throw C;if(!x||x.length===0){h([]),O([]),L(!1);return}const b={};x.forEach(s=>{const r=s.email;b[r]||(b[r]={orders:[],userId:s.user_id}),b[r].orders.push(s)});const U=new Date,g=[];Object.entries(b).forEach(([s,{orders:r,userId:F}])=>{const $=new Date(r[0].created_at),q=Be(U,$),f=r.length,W=r.reduce((u,N)=>u+Number(N.total),0);g.push({userId:F||s,email:s,recencyDays:q,frequency:f,monetary:W,rScore:0,fScore:0,mScore:0,rfmScore:0,segment:""})});const y=g.map(s=>s.recencyDays).sort((s,r)=>s-r),w=g.map(s=>s.frequency).sort((s,r)=>s-r),p=g.map(s=>s.monetary).sort((s,r)=>s-r),c=(s,r)=>s[Math.floor(s.length*r)]||s[0],D=[c(y,.8),c(y,.6),c(y,.4),c(y,.2)],M=[c(w,.2),c(w,.4),c(w,.6),c(w,.8)],S=[c(p,.2),c(p,.4),c(p,.6),c(p,.8)];g.forEach(s=>{s.rScore=6-X(s.recencyDays,D),s.fScore=X(s.frequency,M),s.mScore=X(s.monetary,S),s.rfmScore=s.rScore*100+s.fScore*10+s.mScore,s.segment=Ue(s.rScore,s.fScore,s.mScore)}),g.sort((s,r)=>r.rfmScore-s.rfmScore),h(g);const E={};g.forEach(s=>{E[s.segment]||(E[s.segment]=[]),E[s.segment].push(s.email)});const H=Object.entries(E).map(([s,r])=>({name:s,count:r.length,emails:r,color:Ve[s]||"hsl(0, 0%, 50%)"}));H.sort((s,r)=>r.count-s.count),O(H)}catch(x){console.error("Error fetching RFM data:",x)}finally{L(!1)}};return{customers:i,segments:V,loading:v,getEmailsBySegments:k=>{const x=new Set;return i.forEach(C=>{k.includes(C.segment)&&x.add(C.email)}),Array.from(x)},refetch:_}},ue=[{id:"welcome",name:"Welcome Newsletter",subject:"Welcome to the Healios Family!",content:`Hi there,

Welcome to the Healios community! We're thrilled to have you join us on your wellness journey.

At Healios, we believe that taking care of your health should be simple, effective, and enjoyable. That's why we've created a range of delicious gummy supplements designed to support your wellbeing every day.

Here's what you can look forward to as a subscriber:
- Exclusive offers and early access to new products
- Wellness tips and insights from our team
- Updates on our latest innovations

Ready to start your wellness routine? Visit our shop to explore our full range of supplements.

To your health,
The Healios Team`},{id:"new-product",name:"New Product Launch",subject:"Introducing Our Latest Wellness Innovation",content:`Hi there,

We're excited to share some big news with you!

After months of careful research and development, we're thrilled to introduce our newest addition to the Healios family.

Crafted with the same commitment to quality and effectiveness you've come to expect from us, this new product is designed to help you feel your best every single day.

Be among the first to try it and experience the Healios difference.

Shop now and discover what's new.

To your health,
The Healios Team`},{id:"seasonal",name:"Seasonal Wellness",subject:"Your Seasonal Wellness Guide from Healios",content:`Hi there,

As the seasons change, so do our wellness needs. That's why we wanted to share some tips to help you stay at your best during this time of year.

Supporting your body through seasonal transitions is all about consistency and giving yourself what you need. Our gummy supplements are designed to make that easy and enjoyable.

Whether you're looking to support your immune system, boost your energy, or simply maintain your daily routine, we've got you covered.

Check out our recommendations for this season and give your body the support it deserves.

Stay well,
The Healios Team`},{id:"flash-sale",name:"Flash Sale",subject:"Limited Time Offer - Don't Miss Out!",content:`Hi there,

We wanted to let you know about a special offer just for our newsletter subscribers.

For a limited time, you can enjoy exclusive savings on your favourite Healios products. This is the perfect opportunity to stock up on your wellness essentials or try something new.

But hurry - this offer won't last long!

Shop now and make the most of this exclusive deal.

Happy shopping,
The Healios Team`},{id:"wellness-tips",name:"Wellness Tips",subject:"Simple Wellness Tips to Brighten Your Day",content:`Hi there,

We hope this message finds you well! Today, we wanted to share a few simple tips to help you feel your best.

1. Stay Hydrated - Drinking enough water throughout the day supports energy levels and overall wellbeing.

2. Move Your Body - Even a short walk can boost your mood and help you feel more energised.

3. Prioritise Rest - Quality sleep is essential for recovery and feeling refreshed.

4. Be Consistent - Small daily habits, like taking your Healios gummies, add up to big results over time.

Remember, wellness is a journey, not a destination. We're here to support you every step of the way.

To your health,
The Healios Team`}],me=[{id:"segment-champions",name:"Champions - VIP Rewards",subject:"You're a Healios VIP - Here's Your Exclusive Reward",content:`Hi there,

You're one of our most valued customers, and we wanted to take a moment to say thank you.

Your commitment to your wellness journey inspires us every day. As a token of our appreciation, we've got something special just for you:

EXCLUSIVE VIP OFFER: Use code CHAMPION20 for 20% off your next order, plus free priority shipping.

As a valued member of our community, you'll always be first to know about:
- New product launches before anyone else
- Exclusive VIP-only offers
- Early access to limited editions

Thank you for being part of the Healios family. We're honoured to be part of your wellness routine.

With gratitude,
The Healios Team`},{id:"segment-loyal",name:"Loyal Customers - Appreciation",subject:"Thank You for Your Loyalty - A Special Gift Inside",content:`Hi there,

We've noticed you've been with us for a while now, and we couldn't be more grateful.

Your loyalty means the world to us. As a thank you, we'd love to offer you:

YOUR LOYALTY REWARD: Enjoy 15% off your next order with code LOYAL15

Plus, have you considered sharing Healios with friends? For every friend who makes their first purchase, you'll both receive £5 off your next order.

Here's to many more months of wellness together.

Warmly,
The Healios Team`},{id:"segment-potential-loyalists",name:"Potential Loyalists - Build the Habit",subject:"Ready to Make Wellness a Daily Habit?",content:`Hi there,

We loved seeing you back for another order! It tells us you're serious about your wellness journey.

Did you know that consistency is the key to seeing real results? That's why we created our Subscribe & Save programme:

- Save 15% on every order
- Never run out of your favourites
- Flexible delivery schedules
- Cancel anytime

Making wellness a daily habit has never been easier. Set up your subscription today and enjoy seamless, worry-free deliveries.

To your health,
The Healios Team`},{id:"segment-recent",name:"Recent Customers - Welcome Back",subject:"How's Your Wellness Journey Going?",content:`Hi there,

Thanks for giving Healios a try! We hope you're enjoying your first experience with us.

We'd love to hear how you're finding your products. In the meantime, here are some tips to get the most out of your wellness routine:

- Take your gummies at the same time each day for consistency
- Store them in a cool, dry place
- Pair complementary products for enhanced benefits

Ready to explore more? Use code NEWBIE10 for 10% off your second order.

We're here if you have any questions!

Warmly,
The Healios Team`},{id:"segment-promising",name:"Promising - Encouragement",subject:"Your Wellness Journey is Just Beginning",content:`Hi there,

We noticed you've started your wellness journey with us, and we're cheering you on!

Getting started is often the hardest part, and you've already taken that important first step. Now, let's build on that momentum together.

HERE'S A LITTLE ENCOURAGEMENT: Save 10% on your next order with code KEEPGOING

Not sure what to try next? Here are our most popular products that pair perfectly with what you already have:

- Magnesium Gummies for relaxation and sleep support
- Vitamin D3 for immune and bone health
- Probiotics for digestive wellness

Keep going - you've got this!

The Healios Team`},{id:"segment-need-attention",name:"Need Attention - Re-engagement",subject:"We've Missed You - Here's Something Special",content:`Hi there,

It's been a little while since we've seen you, and we wanted to check in.

Life gets busy - we understand. But your wellness routine doesn't have to be complicated. Just one gummy a day can make a real difference.

WE'D LOVE TO SEE YOU BACK: Enjoy 15% off your next order with code MISSYOU15

Is there anything we can help with? Whether you have questions about our products or need recommendations, we're always here for you.

Looking forward to having you back,
The Healios Team`},{id:"segment-about-to-sleep",name:"About to Sleep - Wake Up Call",subject:"Don't Let Your Wellness Routine Slip Away",content:`Hi there,

We noticed it's been a while since your last order, and we wanted to reach out before too much time passes.

Consistency is everything when it comes to wellness. The good news? It's never too late to get back on track.

TIME-SENSITIVE OFFER: Use code WAKEUPCALL for 15% off - valid for 48 hours only

Your body will thank you for getting back to your routine. We're here to make it easy.

Let's get you back on track,
The Healios Team`},{id:"segment-at-risk",name:"At Risk - Win Back",subject:"We Want You Back - Here's 20% Off",content:`Hi there,

We've noticed you haven't ordered in a while, and honestly? We miss you.

You were one of our valued customers, and we'd love the chance to win you back. Whatever the reason you stepped away, we want to make things right.

WIN-BACK OFFER: Take 20% off your entire order with code COMEBACK20

Plus, free shipping on orders over £30.

Is there something we could do better? We'd genuinely love to hear your feedback. Simply reply to this email, and our team will be in touch.

Hoping to see you again soon,
The Healios Team`},{id:"segment-cant-lose",name:"Can't Lose Them - Urgent Win Back",subject:"We Really Miss You - Please Come Back",content:`Hi there,

You've been one of our best customers, and it's been too long since we've heard from you.

We truly value your support, and we want to do whatever it takes to welcome you back to the Healios family.

OUR BEST OFFER YET: Take 25% off your entire order with code COMEBACKVIP

We'd also love to hear from you. If there's anything we could have done better, or if you have suggestions for new products, please let us know.

Your wellness matters to us,
The Healios Team`},{id:"segment-hibernating",name:"Hibernating - Reactivation",subject:"Time to Restart Your Wellness Journey?",content:`Hi there,

It's been quite some time since we last connected, and we wanted to reach out.

A lot has changed at Healios! We've introduced new products, improved our formulations, and made it even easier to maintain your wellness routine.

REACTIVATION OFFER: Enjoy 20% off + free shipping with code RESTART20

Whether you're ready to jump back in or just curious about what's new, we're here for you.

Here's to fresh starts,
The Healios Team`},{id:"segment-lost",name:"Lost - Final Attempt",subject:"One Last Chance - Our Biggest Discount Ever",content:`Hi there,

We know it's been a long time, and we respect that your priorities may have changed.

Before we say goodbye, we wanted to offer you one final opportunity to reconnect with Healios:

FINAL OFFER: Take 30% off your entire order with code LASTCHANCE30

This is our biggest discount, and it's exclusively for you. If you've found alternatives that work better for you, we understand. But if you're open to giving us another try, we promise to make it worth your while.

Whatever you decide, thank you for being part of our journey.

With appreciation,
The Healios Team`}],de=[...ue,...me],et=()=>{const{user:a}=ve(),[i,h]=Se(),[V,O]=l.useState(null),[v,L]=l.useState([]),[_,z]=l.useState(!0),[k,x]=l.useState(""),[C,b]=l.useState(!1),[U,g]=l.useState(""),[y,w]=l.useState(""),[p,c]=l.useState(""),[D,M]=l.useState(!1),[S,E]=l.useState(!1),[H,s]=l.useState(""),[r,F]=l.useState(""),[$,q]=l.useState([]),[f,W]=l.useState("all"),[u,N]=l.useState([]),{segments:R,loading:P,getEmailsBySegments:G}=$e(12),Z={Champions:"segment-champions","Loyal Customers":"segment-loyal","Potential Loyalists":"segment-potential-loyalists","Recent Customers":"segment-recent",Promising:"segment-promising","Need Attention":"segment-need-attention","About to Sleep":"segment-about-to-sleep","At Risk":"segment-at-risk","Can't Lose Them":"segment-cant-lose",Hibernating:"segment-hibernating",Lost:"segment-lost"},he=Object.entries(Z).reduce((t,[o,n])=>({...t,[n]:o}),{});l.useEffect(()=>{const t=i.get("segment");if(t&&!P&&R.some(n=>n.name===t)){W("segments"),N([t]);const n=Z[t];if(n){const m=de.find(j=>j.id===n);m&&(g(n),w(m.subject),c(m.content))}b(!0),h({})}},[i,P,R]);const ge=t=>{if(g(t),t==="custom")w(""),c("");else{const o=de.find(n=>n.id===t);if(o&&(w(o.subject),c(o.content)),t.startsWith("segment-")){const n=he[t];n&&R.some(m=>m.name===n)&&(W("segments"),N([n]))}}},ee=()=>{w(""),c(""),g(""),E(!1),s(""),F(""),W("all"),N([])};l.useEffect(()=>{fe(),K()},[]);const fe=async()=>{try{const{data:t,error:o}=await T.from("newsletter_subscriptions").select("*").order("subscribed_at",{ascending:!1});if(o)throw o;L(t||[])}catch(t){console.error("Error fetching subscribers:",t),d.error("Failed to load subscribers")}finally{z(!1)}},K=async()=>{try{const{data:t,error:o}=await T.from("scheduled_newsletters").select("*").order("scheduled_at",{ascending:!0});if(o)throw o;q(t||[])}catch(t){console.error("Error fetching scheduled newsletters:",t)}},ye=()=>{const t=v.filter(j=>j.is_active),o=[["Email","Subscribed Date","Status"].join(","),...t.map(j=>[j.email,I(new Date(j.subscribed_at),"yyyy-MM-dd HH:mm:ss"),j.is_active?"Active":"Inactive"].join(","))].join(`
`),n=new Blob([o],{type:"text/csv;charset=utf-8;"}),m=document.createElement("a");m.href=URL.createObjectURL(n),m.download=`newsletter-subscribers-${I(new Date,"yyyy-MM-dd")}.csv`,m.click(),d.success(`Exported ${t.length} subscribers`)},pe=async t=>{O(t.id);try{const{error:o}=await T.from("newsletter_subscriptions").update({is_active:!t.is_active}).eq("id",t.id);if(o)throw o;L(v.map(n=>n.id===t.id?{...n,is_active:!n.is_active}:n)),d.success(`Subscriber ${t.is_active?"deactivated":"activated"}`)}catch(o){console.error("Error toggling subscriber:",o),d.error("Failed to update subscriber")}finally{O(null)}},xe=async()=>{if(!y.trim()||!p.trim()){d.error("Please fill in both subject and content");return}if(S){if(!H||!r){d.error("Please select a date and time for scheduling");return}await be();return}let t=[];if(f==="segments"){if(u.length===0){d.error("Please select at least one customer segment");return}t=G(u)}else t=v.filter(o=>o.is_active).map(o=>o.email);if(t.length===0){d.error("No recipients found for this campaign");return}M(!0);try{const{data:o,error:n}=await T.from("email_campaigns").insert({subject:y,content:p,recipients_count:t.length,target_segments:f==="segments"?u:[],targeting_mode:f,created_by:(a==null?void 0:a.id)||null}).select().single();n&&console.error("Error creating campaign record:",n);const{data:m,error:j}=await T.functions.invoke("send-newsletter",{body:{subject:y,content:p,recipients:t,campaignId:o==null?void 0:o.id,segments:f==="segments"?u:null}});if(j)throw j;const je=f==="segments"?`${u.join(", ")} segment${u.length>1?"s":""}`:"all subscribers";d.success(`Newsletter sent to ${m.sent} recipients (${je})`),m.failed>0&&d.warning(`${m.failed} emails failed to send`),b(!1),ee()}catch(o){console.error("Error sending newsletter:",o),d.error(o.message||"Failed to send newsletter")}finally{M(!1)}},be=async()=>{const t=new Date(`${H}T${r}`);if(t<=new Date){d.error("Scheduled time must be in the future");return}M(!0);try{const{error:o}=await T.from("scheduled_newsletters").insert({subject:y,content:p,scheduled_at:t.toISOString(),created_by:(a==null?void 0:a.id)||null});if(o)throw o;d.success(`Newsletter scheduled for ${I(t,"MMM d, yyyy 'at' h:mm a")}`),b(!1),ee(),K()}catch(o){console.error("Error scheduling newsletter:",o),d.error(o.message||"Failed to schedule newsletter")}finally{M(!1)}},we=async t=>{try{const{error:o}=await T.from("scheduled_newsletters").update({status:"cancelled"}).eq("id",t);if(o)throw o;d.success("Scheduled newsletter cancelled"),K()}catch(o){console.error("Error cancelling newsletter:",o),d.error("Failed to cancel newsletter")}},te=$.filter(t=>t.status==="pending"),se=v.filter(t=>t.email.toLowerCase().includes(k.toLowerCase())),B=v.filter(t=>t.is_active).length;return e.jsxs(Fe,{title:"Newsletter Subscribers",children:[e.jsxs("div",{className:"grid grid-cols-2 gap-4 mb-8",children:[e.jsxs("div",{className:"bg-card border border-border rounded-lg p-4",children:[e.jsxs("div",{className:"flex items-center gap-2 mb-1",children:[e.jsx(oe,{className:"h-4 w-4 text-muted-foreground"}),e.jsx("p",{className:"text-sm text-muted-foreground",children:"Total Subscribers"})]}),e.jsx("p",{className:"text-2xl font-medium text-foreground",children:v.length})]}),e.jsxs("div",{className:"bg-green-50 border border-green-200 rounded-lg p-4",children:[e.jsxs("div",{className:"flex items-center gap-2 mb-1",children:[e.jsx(J,{className:"h-4 w-4 text-green-600"}),e.jsx("p",{className:"text-sm text-green-700",children:"Active Subscribers"})]}),e.jsx("p",{className:"text-2xl font-medium text-green-800",children:B})]})]}),e.jsxs("div",{className:"flex flex-col sm:flex-row gap-4 mb-6",children:[e.jsxs("div",{className:"relative flex-1",children:[e.jsx(Ne,{className:"absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"}),e.jsx(Y,{placeholder:"Search by email...",value:k,onChange:t=>x(t.target.value),className:"pl-10"})]}),e.jsxs(A,{onClick:ye,variant:"outline",className:"gap-2",children:[e.jsx(Ye,{className:"h-4 w-4"}),"Export CSV"]}),e.jsxs(Te,{open:C,onOpenChange:b,children:[e.jsx(ke,{asChild:!0,children:e.jsxs(A,{className:"gap-2",disabled:B===0,children:[e.jsx(re,{className:"h-4 w-4"}),"Send Newsletter"]})}),e.jsxs(Ce,{className:"sm:max-w-lg max-h-[90vh] overflow-y-auto",children:[e.jsx(Ee,{children:e.jsx(He,{children:"Compose Newsletter"})}),e.jsxs("div",{className:"space-y-4 pt-4",children:[e.jsxs("div",{children:[e.jsx("label",{className:"text-sm font-medium text-foreground mb-2 block",children:"Target Audience"}),e.jsxs("div",{className:"grid grid-cols-2 gap-2",children:[e.jsxs(A,{type:"button",variant:f==="all"?"default":"outline",className:"justify-start gap-2",onClick:()=>{W("all"),N([])},children:[e.jsx(oe,{className:"h-4 w-4"}),"All Subscribers (",B,")"]}),e.jsxs(A,{type:"button",variant:f==="segments"?"default":"outline",className:"justify-start gap-2",onClick:()=>W("segments"),disabled:P||R.length===0,children:[e.jsx(le,{className:"h-4 w-4"}),"RFM Segments"]})]})]}),f==="segments"&&e.jsxs("div",{className:"border border-border rounded-lg p-3 space-y-2 bg-muted/30",children:[e.jsxs("div",{className:"flex items-center justify-between mb-2",children:[e.jsx("span",{className:"text-sm font-medium text-foreground",children:"Select Customer Segments"}),e.jsx("span",{className:"text-xs text-muted-foreground",children:u.length>0?`${G(u).length} recipients`:"No segments selected"})]}),P?e.jsxs("div",{className:"flex items-center gap-2 py-4 justify-center",children:[e.jsx(ae,{className:"h-4 w-4 animate-spin"}),e.jsx("span",{className:"text-sm text-muted-foreground",children:"Loading segments..."})]}):R.length===0?e.jsx("p",{className:"text-sm text-muted-foreground py-2 text-center",children:"No customer segments available. RFM analysis requires order history."}):e.jsx("div",{className:"space-y-1.5 max-h-48 overflow-y-auto",children:R.map(t=>e.jsxs("label",{className:"flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer",children:[e.jsx(We,{checked:u.includes(t.name),onCheckedChange:o=>{N(o?[...u,t.name]:u.filter(n=>n!==t.name))}}),e.jsxs("div",{className:"flex items-center gap-2 flex-1",children:[e.jsx("div",{className:"w-2.5 h-2.5 rounded-full flex-shrink-0",style:{backgroundColor:t.color}}),e.jsx("span",{className:"text-sm text-foreground",children:t.name})]}),e.jsxs(Ae,{variant:"secondary",className:"text-xs",children:[t.count," customers"]})]},t.name))})]}),e.jsxs("div",{children:[e.jsx("label",{className:"text-sm font-medium text-foreground mb-1.5 block",children:"Template"}),e.jsxs(Le,{value:U,onValueChange:ge,children:[e.jsx(Me,{children:e.jsx(Re,{placeholder:"Choose a template or start from scratch..."})}),e.jsxs(Ie,{children:[e.jsx(Q,{value:"custom",children:e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(Oe,{className:"h-4 w-4"}),"Start from scratch"]})}),e.jsx("div",{className:"px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1",children:"General Templates"}),ue.map(t=>e.jsx(Q,{value:t.id,children:e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(J,{className:"h-4 w-4"}),t.name]})},t.id)),e.jsx("div",{className:"px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1",children:"Segment Campaigns"}),me.map(t=>e.jsx(Q,{value:t.id,children:e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(le,{className:"h-4 w-4"}),t.name]})},t.id))]})]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"text-sm font-medium text-foreground mb-1.5 block",children:"Subject"}),e.jsx(Y,{placeholder:"Enter email subject...",value:y,onChange:t=>w(t.target.value)})]}),e.jsxs("div",{children:[e.jsx("label",{className:"text-sm font-medium text-foreground mb-1.5 block",children:"Content"}),e.jsx(De,{placeholder:"Write your newsletter content...",value:p,onChange:t=>c(t.target.value),rows:10,className:"font-mono text-sm"})]}),e.jsxs("div",{className:"flex items-center gap-3 py-2 border-t border-border",children:[e.jsx(ce,{checked:S,onCheckedChange:E}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(ne,{className:"h-4 w-4 text-muted-foreground"}),e.jsx("span",{className:"text-sm text-foreground",children:"Schedule for later"})]})]}),S&&e.jsxs("div",{className:"grid grid-cols-2 gap-4",children:[e.jsxs("div",{children:[e.jsx("label",{className:"text-sm font-medium text-foreground mb-1.5 block",children:"Date"}),e.jsx(Y,{type:"date",value:H,onChange:t=>s(t.target.value),min:I(new Date,"yyyy-MM-dd")})]}),e.jsxs("div",{children:[e.jsx("label",{className:"text-sm font-medium text-foreground mb-1.5 block",children:"Time"}),e.jsx(Y,{type:"time",value:r,onChange:t=>F(t.target.value)})]})]}),e.jsxs("div",{className:"flex justify-end gap-3 pt-2",children:[e.jsx(A,{variant:"outline",onClick:()=>b(!1),disabled:D,children:"Cancel"}),e.jsx(A,{onClick:xe,disabled:D||!y.trim()||!p.trim()||S&&(!H||!r)||f==="segments"&&u.length===0,className:"gap-2",children:D?e.jsxs(e.Fragment,{children:[e.jsx(ae,{className:"h-4 w-4 animate-spin"}),S?"Scheduling...":"Sending..."]}):S?e.jsxs(e.Fragment,{children:[e.jsx(ie,{className:"h-4 w-4"}),"Schedule Newsletter"]}):e.jsxs(e.Fragment,{children:[e.jsx(re,{className:"h-4 w-4"}),"Send to ",f==="segments"?`${G(u).length} customers`:`${B} subscribers`]})})]})]})]})]})]}),te.length>0&&e.jsxs("div",{className:"mb-8",children:[e.jsxs("h2",{className:"text-lg font-medium text-foreground mb-4 flex items-center gap-2",children:[e.jsx(ne,{className:"h-5 w-5"}),"Scheduled Newsletters"]}),e.jsx("div",{className:"space-y-3",children:te.map(t=>e.jsxs("div",{className:"bg-card border border-border rounded-lg p-4 flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsx("p",{className:"font-medium text-foreground",children:t.subject}),e.jsxs("p",{className:"text-sm text-muted-foreground flex items-center gap-2 mt-1",children:[e.jsx(ie,{className:"h-4 w-4"}),"Scheduled for ",I(new Date(t.scheduled_at),"MMM d, yyyy 'at' h:mm a")]})]}),e.jsxs(A,{variant:"ghost",size:"sm",onClick:()=>we(t.id),className:"text-destructive hover:text-destructive",children:[e.jsx(_e,{className:"h-4 w-4 mr-1"}),"Cancel"]})]},t.id))})]}),_?e.jsx("div",{className:"space-y-3",children:[...Array(5)].map((t,o)=>e.jsx("div",{className:"h-16 bg-muted animate-pulse rounded-lg"},o))}):se.length>0?e.jsx("div",{className:"bg-card border border-border rounded-lg overflow-hidden",children:e.jsxs("table",{className:"w-full",children:[e.jsx("thead",{className:"bg-muted/50",children:e.jsxs("tr",{children:[e.jsx("th",{className:"text-left p-4 text-sm font-medium text-foreground",children:"Email"}),e.jsx("th",{className:"text-left p-4 text-sm font-medium text-foreground",children:"Subscribed"}),e.jsx("th",{className:"text-left p-4 text-sm font-medium text-foreground",children:"Status"})]})}),e.jsx("tbody",{children:se.map(t=>e.jsxs("tr",{className:"border-t border-border",children:[e.jsx("td",{className:"p-4 text-sm text-foreground",children:t.email}),e.jsx("td",{className:"p-4 text-sm text-muted-foreground",children:I(new Date(t.subscribed_at),"MMM d, yyyy")}),e.jsx("td",{className:"p-4",children:e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(ce,{checked:t.is_active,onCheckedChange:()=>pe(t),disabled:V===t.id}),e.jsx("span",{className:`text-xs ${t.is_active?"text-green-700":"text-muted-foreground"}`,children:t.is_active?"Active":"Inactive"})]})})]},t.id))})]})}):e.jsxs("div",{className:"text-center py-12 bg-card border border-border rounded-lg",children:[e.jsx(J,{className:"mx-auto h-12 w-12 text-muted-foreground mb-4"}),e.jsx("p",{className:"text-muted-foreground",children:k?"No subscribers match your search":"No subscribers yet"})]})]})};export{et as default};

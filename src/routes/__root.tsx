import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#0c0f1e" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { title: "Noble Bet" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/jpeg", href: "/favicon.jpg" },
      { rel: "apple-touch-icon", href: "/favicon.jpg" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

const FALLBACK_JS = `(function(){
  var TOTAL=3,step=0;
  function val(id){var e=document.getElementById(id);return e?e.value.trim():'';}
  function checked(name){return!!document.querySelector('input[name="'+name+'"]:checked');}
  function filesOk(name){var i=document.querySelector('input[data-upload="'+name+'"]');return i&&i.files&&i.files.length>0;}
  function stepOk(){
    if(step===0){
      var em=val('f-email'),ph=val('f-phone').replace(/\\D/g,'');
      return/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(em)&&ph.length>=8&&ph.length<=15
        &&val('f-firstName')&&val('f-lastName')&&val('f-referrer')
        &&checked('hasSportsbettingAccount')&&checked('participatedSimilar')
        &&!!document.querySelector('input[name="hasValidId"][value="Yes"]:checked');
    }
    if(step===1)return!!document.querySelector('input[name="agreedTerms"][value="Yes"]:checked');
    if(step===2)return['licenseFront','licenseBack','medicareOrPassport','selfie'].every(filesOk);
    return true;
  }
  function goStep(n){
    step=n;
    document.querySelectorAll('[data-step]').forEach(function(el){
      el.style.display=parseInt(el.getAttribute('data-step'))===n?'':'none';
    });
    var bb=document.getElementById('back-btn');
    var cb=document.getElementById('continue-btn');
    var sb=document.getElementById('submit-btn');
    var last=n===TOTAL-1;
    if(bb)bb.style.visibility=n===0?'hidden':'visible';
    if(cb)cb.style.display=last?'none':'';
    if(sb)sb.style.display=last?'':'none';
    refresh();
    window.scrollTo({top:0,behavior:'smooth'});
  }
  function refresh(){
    var cb=document.getElementById('continue-btn');
    if(cb&&cb.style.display!=='none')cb.disabled=!stepOk();
  }
  function onFileChange(e){
    var input=e.target;
    if(input.type!=='file'||!input.dataset.upload)return;
    var label=document.querySelector('[data-upload-ui="'+input.dataset.upload+'"]');
    if(!label)return;
    if(input.files&&input.files.length>0){
      var fname=input.files[0].name;
      var ps=label.querySelectorAll('p');
      if(ps[0]){ps[0].textContent='✓ Uploaded';ps[0].style.color='oklch(0.65 0.18 250)';}
      if(ps[1]){ps[1].textContent=fname;}
      label.style.background='oklch(0.65 0.18 250 / 0.12)';
      label.style.borderColor='oklch(0.65 0.18 250 / 0.6)';
    }
    refresh();
  }
  document.addEventListener('DOMContentLoaded',function(){
    var cb=document.getElementById('continue-btn');
    var bb=document.getElementById('back-btn');
    if(!cb)return;
    cb.addEventListener('click',function(){if(step<TOTAL-1&&!cb.disabled)goStep(step+1);});
    if(bb)bb.addEventListener('click',function(){if(step>0)goStep(step-1);});
    document.addEventListener('input',refresh);
    document.addEventListener('change',function(e){onFileChange(e);refresh();});
    refresh();
  });
})();`;

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
        <script dangerouslySetInnerHTML={{ __html: FALLBACK_JS }} />
      </body>
    </html>
  );
}

function RootComponent() {
  return <Outlet />;
}

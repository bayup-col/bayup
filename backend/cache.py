"""
Utilidades de caché en memoria y tokens de preview de corta vida.
Módulo independiente para evitar importar main.py desde los routers.
"""
import time
import secrets

# ── Stores ────────────────────────────────────────────────────────────────
shop_cache: dict = {}       # {slug: (data_dict, expires_at)}
templates_cache: dict = {}  # {"list": (data_list, expires_at)}


# ── Caché TTL simple ──────────────────────────────────────────────────────

def cache_get(store: dict, key: str):
    """Devuelve el valor cacheado si no expiró, None si falta o expiró."""
    entry = store.get(key)
    if entry and entry[1] > time.time():
        return entry[0]
    return None


def cache_set(store: dict, key: str, value, ttl: int, max_size: int = 500) -> None:
    """Almacena value en store[key] con TTL en segundos.
    Limita el tamaño eliminando las 100 entradas más antiguas cuando supera max_size."""
    store[key] = (value, time.time() + ttl)
    if len(store) > max_size:
        for k in list(store.keys())[:100]:
            del store[k]


# ── Preview tokens de corta vida (ALTA-004) ───────────────────────────────
# Evita exponer el JWT completo en la URL de preview (queda en logs de servidor).

_preview_tokens: dict[str, tuple[str, float]] = {}


def create_preview_token(user_email: str) -> str:
    """Genera un token opaco de 5 minutos para preview sin JWT en URL."""
    tok = secrets.token_urlsafe(32)
    _preview_tokens[tok] = (user_email, time.time() + 300)
    now = time.time()
    expired = [k for k, (_, exp) in _preview_tokens.items() if exp < now]
    for k in expired:
        del _preview_tokens[k]
    return tok


def validate_preview_token(token: str) -> str | None:
    """Retorna el email si el token es válido, None si no."""
    entry = _preview_tokens.get(token)
    if not entry:
        return None
    email, expires_at = entry
    if time.time() > expires_at:
        del _preview_tokens[token]
        return None
    return email


# ── SDK de preview ────────────────────────────────────────────────────────
BAYUP_PREVIEW_SDK = """
<meta name="google" content="notranslate">
<meta name="translate" content="no">
<script id="bayup-preview-sdk">
(function(){
  var TPLID='__TPLID__',TOK='__TOK__',BASE='__BASE__';
  var params=new URLSearchParams(window.location.search);
  var PID=params.get('product_id');
  var STORE={name:'Mi Tienda Demo',phone:'573000000000'};
  var PRODUCTS=[
    {id:'1',name:'Vestido Elegante',price:189900,img:'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=500&fit=crop&auto=format'},
    {id:'2',name:'Blusa Premium',price:89900,img:'https://images.unsplash.com/photo-1551803091-e20673f15770?w=400&h=500&fit=crop&auto=format'},
    {id:'3',name:'Falda Minimalista',price:129900,img:'https://images.unsplash.com/photo-1594938298603-c8148c4b4a35?w=400&h=500&fit=crop&auto=format'},
    {id:'4',name:'Blazer Moderno',price:249900,img:'https://images.unsplash.com/photo-1594226801341-41427b4e5c22?w=400&h=500&fit=crop&auto=format'},
    {id:'5',name:'Pantalon Formal',price:149900,img:'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=400&h=500&fit=crop&auto=format'},
    {id:'6',name:'Conjunto Casual',price:199900,img:'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=400&h=500&fit=crop&auto=format'}
  ];
  var CKEY='bayup_preview_cart';
  function go(page,extra){
    var u=BASE+'/super-admin/web-templates/'+TPLID+'/live-preview/'+page+'?token='+encodeURIComponent(TOK);
    if(extra)u+='&'+extra;
    window.location.href=u;
  }
  function fmt(n){return '$'+n.toString().replace(/\\B(?=(\\d{3})+(?!\\d))/g,'.');}
  function getCart(){try{return JSON.parse(localStorage.getItem(CKEY)||'[]');}catch(e){return[];}}
  function saveCart(c){localStorage.setItem(CKEY,JSON.stringify(c));}
  function badge(){
    var n=getCart().reduce(function(s,i){return s+i.qty;},0);
    document.querySelectorAll('[data-bayup="cart-count"]').forEach(function(el){
      el.textContent=n;el.style.display=n?'':'none';
    });
  }
  function fillStore(){
    document.querySelectorAll('[data-bayup="store-name"]').forEach(function(el){el.textContent=STORE.name;});
    document.querySelectorAll('[data-bayup="store-phone"]').forEach(function(el){el.textContent='+57 300 000 0000';});
  }
  function fillGrid(){
    var grid=document.querySelector('[data-bayup="product-grid"]');
    var tmpl=document.querySelector('template[data-bayup="product-card-template"]');
    if(!grid||!tmpl)return;
    grid.innerHTML='';
    PRODUCTS.forEach(function(p){
      var c=tmpl.content.cloneNode(true);
      var img=c.querySelector('[data-bayup-card="image"]');
      var nm=c.querySelector('[data-bayup-card="name"]');
      var pr=c.querySelector('[data-bayup-card="price"]');
      var ab=c.querySelector('[data-bayup-action="add-to-cart"]');
      var nb=c.querySelector('[data-bayup-action="nav-product"]');
      if(img){img.src=p.img;img.alt=p.name;}
      if(nm)nm.textContent=p.name;
      if(pr)pr.textContent=fmt(p.price);
      if(ab)ab.dataset.bayupProductId=p.id;
      if(nb)nb.dataset.bayupProductId=p.id;
      grid.appendChild(c);
    });
  }
  function fillProduct(){
    if(!PID)return;
    var p=PRODUCTS.find(function(x){return x.id===PID;})||PRODUCTS[0];
    document.querySelectorAll('[data-bayup="product-name"]').forEach(function(el){el.textContent=p.name;});
    document.querySelectorAll('[data-bayup="product-price"]').forEach(function(el){el.textContent=fmt(p.price);});
    document.querySelectorAll('[data-bayup="product-description"]').forEach(function(el){el.textContent='Descripcion de muestra para '+p.name+'.';});
    document.querySelectorAll('img[data-bayup="product-image"]').forEach(function(el){el.src=p.img;el.alt=p.name;});
    var ab=document.querySelector('[data-bayup-action="add-to-cart"]');
    if(ab)ab.dataset.bayupProductId=p.id;
  }
  function fillCart(){
    var tbody=document.querySelector('[data-bayup="cart-items"]');
    var tmpl=document.querySelector('template[data-bayup="cart-row-template"]');
    if(!tbody)return;
    var cart=getCart();
    tbody.innerHTML='';
    if(!cart.length){
      var r=document.createElement('tr');
      r.innerHTML='<td colspan="4" style="text-align:center;padding:2rem;color:#9ca3af;">El carrito esta vacio</td>';
      tbody.appendChild(r);
    }else{
      cart.forEach(function(item){
        if(!tmpl)return;
        var c=tmpl.content.cloneNode(true);
        var fn=function(s,v){var e=c.querySelector('[data-bayup-row="'+s+'"]');if(e)e.textContent=v;};
        fn('name',item.name);fn('price',fmt(item.price));fn('qty',item.qty);fn('subtotal',fmt(item.price*item.qty));
        tbody.appendChild(c);
      });
    }
    var total=cart.reduce(function(s,i){return s+i.price*i.qty;},0);
    document.querySelectorAll('[data-bayup="cart-subtotal"],[data-bayup="cart-total"]').forEach(function(el){el.textContent=fmt(total);});
  }
  function bindActions(){
    document.addEventListener('click',function(e){
      var el=e.target.closest('[data-bayup-action]');
      if(!el)return;
      var a=el.dataset.bayupAction;
      var MAP={
        'nav-home':'home','nav-catalog':'catalog','nav-contact':'contact',
        'nav-privacy':'privacy','nav-cart':'cart'
      };
      if(MAP[a]){e.preventDefault();go(MAP[a]);return;}
      if(a==='nav-product'){
        e.preventDefault();go('product','product_id='+(el.dataset.bayupProductId||'1'));return;
      }
      if(a==='add-to-cart'){
        var pid=el.dataset.bayupProductId;
        var p=PRODUCTS.find(function(x){return x.id===pid;})||PRODUCTS[0];
        var cart=getCart();
        var ex=cart.find(function(i){return i.id===p.id;});
        if(ex)ex.qty++;else cart.push({id:p.id,name:p.name,price:p.price,qty:1});
        saveCart(cart);badge();fillCart();
        var orig=el.textContent;el.textContent='\\u2713 Agregado';
        setTimeout(function(){el.textContent=orig;},1200);
        return;
      }
      if(a==='checkout'){
        e.preventDefault();
        var cart=getCart();
        if(!cart.length){alert('El carrito esta vacio (DEMO)');return;}
        var msg='*Pedido Demo*\\n'+cart.map(function(i){return '- '+i.name+' x'+i.qty+' = '+fmt(i.price*i.qty);}).join('\\n');
        window.open('https://wa.me/'+STORE.phone+'?text='+encodeURIComponent(msg),'_blank');
      }
    });
  }
  function init(){fillStore();fillGrid();fillProduct();fillCart();badge();bindActions();}
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init);}else{init();}
  // Banner de modo demo
  var bar=document.createElement('div');
  bar.style.cssText='position:fixed;top:0;left:0;right:0;z-index:99999;background:#7c3aed;color:#fff;text-align:center;padding:6px 12px;font-size:11px;font-weight:700;letter-spacing:.05em;';
  bar.textContent='\\u25B6 MODO PREVIEW — datos de demostración';
  document.body.prepend(bar);
})();
</script>
"""


# ── SDK de producción (tiendas HTML activas) ────────────────────────────
BAYUP_SDK = """
<script id="bayup-sdk">
(function(){
  const SLUG = document.documentElement.dataset.bayupSlug || '';
  const API  = document.documentElement.dataset.bayupApi  || '';
  const PAGE = document.documentElement.dataset.bayupPage || 'home';

  // --- Estado del carrito en localStorage ---
  const CART_KEY = 'bayup_cart_' + SLUG;
  function getCart(){ try{ return JSON.parse(localStorage.getItem(CART_KEY)||'[]'); }catch(e){ return []; } }
  function saveCart(c){ localStorage.setItem(CART_KEY, JSON.stringify(c)); }

  function cartTotal(cart){ return cart.reduce(function(s,i){ return s + i.unit_price * i.qty; }, 0); }
  function cartCount(cart){ return cart.reduce(function(s,i){ return s + i.qty; }, 0); }

  function formatCOP(n){ return '$' + Math.round(n).toLocaleString('es-CO'); }

  // --- Actualiza todos los elementos del DOM ---
  function render(store, products){
    // Nombre e info de tienda
    document.querySelectorAll('[data-bayup="store-name"]').forEach(function(el){ el.textContent = store.full_name || store.name || SLUG; });
    document.querySelectorAll('[data-bayup="store-phone"]').forEach(function(el){ el.textContent = store.phone || ''; });
    document.querySelectorAll('img[data-bayup="store-logo"]').forEach(function(el){ if(store.logo_url) el.src = store.logo_url; });

    // Página de detalle de producto
    if(PAGE === 'product'){
      var params = new URLSearchParams(window.location.search);
      var productId = params.get('product_id');
      if(productId && products.length){
        var p = products.find(function(x){ return String(x.id) === String(productId); });
        if(p){
          document.querySelectorAll('[data-bayup="product-name"]').forEach(function(el){ el.textContent = p.name; });
          document.querySelectorAll('[data-bayup="product-price"]').forEach(function(el){ el.textContent = formatCOP(p.price); });
          document.querySelectorAll('[data-bayup="product-description"]').forEach(function(el){ el.textContent = p.description || ''; });
          document.querySelectorAll('img[data-bayup="product-image"]').forEach(function(el){ if(p.image_url&&p.image_url[0]) el.src=p.image_url[0]; });
          document.querySelectorAll('[data-bayup-action="add-to-cart"]').forEach(function(el){
            el.dataset.bayupProductId=String(p.id);
            el.dataset.bayupProductName=p.name;
            el.dataset.bayupProductPrice=String(p.price);
          });
        }
      }
    }

    // Grilla de productos
    var grid = document.querySelector('[data-bayup="product-grid"]');
    var cardTpl = document.querySelector('template[data-bayup="product-card-template"]');
    if(grid && cardTpl && products.length){
      grid.innerHTML = '';
      products.forEach(function(p){
        var clone = cardTpl.content.cloneNode(true);
        clone.querySelectorAll('[data-bayup-card="name"]').forEach(function(el){ el.textContent = p.name; });
        clone.querySelectorAll('[data-bayup-card="price"]').forEach(function(el){ el.textContent = formatCOP(p.price); });
        clone.querySelectorAll('img[data-bayup-card="image"]').forEach(function(el){ if(p.image_url&&p.image_url[0]) el.src=p.image_url[0]; });
        clone.querySelectorAll('[data-bayup-action="add-to-cart"]').forEach(function(el){ el.dataset.bayupProductId=String(p.id); el.dataset.bayupProductName=p.name; el.dataset.bayupProductPrice=String(p.price); });
        clone.querySelectorAll('[data-bayup-action="nav-product"]').forEach(function(el){ el.dataset.bayupProductId=String(p.id); });
        grid.appendChild(clone);
      });
    }

    renderCart();
  }

  function renderCart(){
    var cart = getCart();
    var count = cartCount(cart);
    document.querySelectorAll('[data-bayup="cart-count"]').forEach(function(el){
      el.textContent = count || '';
      el.style.display = count ? '' : 'none';
    });
    document.querySelectorAll('[data-bayup="cart-total"]').forEach(function(el){ el.textContent = formatCOP(cartTotal(cart)); });
    document.querySelectorAll('[data-bayup="cart-subtotal"]').forEach(function(el){ el.textContent = formatCOP(cartTotal(cart)); });
    var cartList = document.querySelector('[data-bayup="cart-items"]');
    var cartRowTpl = document.querySelector('template[data-bayup="cart-row-template"]');
    if(cartList){
      cartList.innerHTML = '';
      if(!cart.length){
        var empty = document.createElement('tr');
        empty.innerHTML = '<td colspan="5" class="py-12 text-center text-slate-400">Tu carrito está vacío</td>';
        cartList.appendChild(empty);
      } else {
        cart.forEach(function(item){
          if(cartRowTpl){
            var clone = cartRowTpl.content.cloneNode(true);
            clone.querySelectorAll('[data-bayup-row="name"]').forEach(function(el){ el.textContent = item.name; });
            clone.querySelectorAll('[data-bayup-row="price"]').forEach(function(el){ el.textContent = formatCOP(item.unit_price); });
            clone.querySelectorAll('[data-bayup-row="subtotal"]').forEach(function(el){ el.textContent = formatCOP(item.unit_price * item.qty); });
            clone.querySelectorAll('[data-bayup-row="qty"]').forEach(function(el){ el.textContent = String(item.qty); });
            cartList.appendChild(clone);
          } else {
            var li = document.createElement('div');
            li.className = 'bayup-cart-item';
            var _s1=document.createElement('span');_s1.textContent=item.name+' x'+item.qty;
            var _s2=document.createElement('span');_s2.textContent=formatCOP(item.unit_price*item.qty);
            li.appendChild(_s1);li.appendChild(_s2);
            cartList.appendChild(li);
          }
        });
      }
    }
  }

  // --- Acciones globales (delegación de eventos) ---
  document.addEventListener('click', function(e){
    var el = e.target.closest('[data-bayup-action]');
    if(!el) return;
    var action = el.dataset.bayupAction;

    if(action === 'add-to-cart'){
      var cart = getCart();
      var id = el.dataset.bayupProductId;
      var existing = cart.find(function(i){ return i.product_id === id; });
      if(existing){ existing.qty += 1; }
      else{ cart.push({ product_id:id, name:el.dataset.bayupProductName, unit_price:Number(el.dataset.bayupProductPrice), qty:1 }); }
      saveCart(cart);
      renderCart();
      el.textContent = '✓ Añadido';
      setTimeout(function(){ el.textContent = 'Agregar'; }, 1200);
    }

    if(action === 'checkout'){
      var cart = getCart();
      if(!cart.length){ alert('Tu carrito está vacío'); return; }
      var phone = document.documentElement.dataset.bayupPhone || '';
      var lines  = ['*Nuevo pedido*',''];
      cart.forEach(function(i){ lines.push('• ' + i.name + ' ×' + i.qty + '  → ' + formatCOP(i.unit_price * i.qty)); });
      lines.push('','*Total: ' + formatCOP(cartTotal(cart)) + ' COP*');
      var text  = encodeURIComponent(lines.join('\\n'));
      var clean = phone.replace(/[^0-9]/g,'');
      window.open('https://wa.me/' + clean + '?text=' + text, '_blank');
    }

    if(action === 'nav-home')    window.location.href = '/html-shop/' + SLUG + '/home';
    if(action === 'nav-catalog') window.location.href = '/html-shop/' + SLUG + '/catalog';
    if(action === 'nav-cart')    window.location.href = '/html-shop/' + SLUG + '/cart';
    if(action === 'nav-contact') window.location.href = '/html-shop/' + SLUG + '/contact';
    if(action === 'nav-privacy') window.location.href = '/html-shop/' + SLUG + '/privacy';
    if(action === 'nav-product') window.location.href = '/html-shop/' + SLUG + '/product?product_id=' + (el.dataset.bayupProductId||'');
  });

  // --- Bootstrap: carga datos de la tienda y productos ---
  async function init(){
    try{
      var [storeRes, productsRes] = await Promise.all([
        fetch(API + '/public/shop-info/' + SLUG),
        fetch(API + '/public/shop/' + SLUG + '/products?limit=100'),
      ]);
      var store    = storeRes.ok    ? await storeRes.json()    : {};
      var products = productsRes.ok ? await productsRes.json() : [];
      render(store, Array.isArray(products) ? products : []);
    } catch(err){
      console.warn('[Bayup SDK] Error cargando datos:', err);
    }
  }

  if(document.readyState === 'loading'){ document.addEventListener('DOMContentLoaded', init); }
  else { init(); }
})();
</script>
"""

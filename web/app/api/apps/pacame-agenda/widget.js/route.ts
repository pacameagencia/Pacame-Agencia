import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/apps/pacame-agenda/widget.js
 *
 * Devuelve un bundle vanilla JS (sin dependencias) que el cliente embebe en
 * su web con:
 *   <div data-pacame-agenda="INSTANCE_UUID" data-primary="#7C3AED"></div>
 *   <script src="https://pacameagencia.com/api/apps/pacame-agenda/widget.js" defer></script>
 *
 * El widget:
 *   1. Lista servicios (GET /services).
 *   2. Muestra navegador semanal + slots disponibles (GET /availability).
 *   3. Form customer + POST /book.
 *   4. Confirmacion + referencia.
 *
 * Estilos inline con paleta adaptable (data-primary override).
 */

export const runtime = "nodejs";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

function buildWidgetScript(apiOrigin: string): string {
  // Nota: todas las plantillas van escapadas. Ojo a los caracteres `${`.
  return `/* PACAME Agenda widget — vanilla JS, sin dependencias. */
(function(){
  "use strict";
  var API_ORIGIN = ${JSON.stringify(apiOrigin)};

  function formatEUR(cents){
    if(cents == null) return "";
    return (cents/100).toLocaleString("es-ES",{style:"currency",currency:"EUR"});
  }
  function pad(n){ return String(n).padStart(2,"0"); }
  function ymd(date){
    return date.getFullYear()+"-"+pad(date.getMonth()+1)+"-"+pad(date.getDate());
  }
  function addDays(date,n){ var d=new Date(date.getTime()); d.setDate(d.getDate()+n); return d; }
  function startOfWeek(date){
    var d = new Date(date.getTime());
    var day = d.getDay(); // 0=dom
    var diff = (day===0?-6:1-day);
    return addDays(d,diff);
  }
  function fmtDayShort(date){
    return date.toLocaleDateString("es-ES",{weekday:"short",day:"numeric",month:"short"});
  }
  function fmtTime(iso, tz){
    try { return new Date(iso).toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit",timeZone:tz||undefined}); }
    catch(e){ return iso; }
  }
  function fmtFull(iso, tz){
    try { return new Date(iso).toLocaleString("es-ES",{weekday:"long",day:"numeric",month:"long",hour:"2-digit",minute:"2-digit",timeZone:tz||undefined}); }
    catch(e){ return iso; }
  }

  function fetchJSON(url, opts){
    return fetch(url, Object.assign({mode:"cors"}, opts||{}))
      .then(function(r){ return r.json().then(function(j){ return {ok:r.ok, status:r.status, body:j}; }); });
  }

  function mountStyles(root, primary){
    var style = document.createElement("style");
    var p = primary || "#7C3AED";
    style.textContent =
      ".pa-wrap{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;color:#111;background:#fff;border:1px solid #e5e5e5;border-radius:16px;padding:20px;max-width:640px;margin:0 auto;box-sizing:border-box}"+
      ".pa-wrap *{box-sizing:border-box}"+
      ".pa-h{font-weight:700;font-size:20px;margin:0 0 4px}"+
      ".pa-sub{color:#666;font-size:14px;margin:0 0 16px}"+
      ".pa-svc{display:grid;gap:8px}"+
      ".pa-svc button{text-align:left;background:#fafafa;border:1px solid #e5e5e5;border-radius:12px;padding:12px 14px;cursor:pointer;transition:.15s}"+
      ".pa-svc button:hover{border-color:"+p+"}"+
      ".pa-svc .pa-row{display:flex;justify-content:space-between;gap:8px;align-items:center}"+
      ".pa-svc .pa-name{font-weight:600;font-size:15px}"+
      ".pa-svc .pa-meta{color:#666;font-size:13px}"+
      ".pa-svc .pa-price{font-weight:600;font-size:15px;color:"+p+"}"+
      ".pa-svc .pa-desc{color:#666;font-size:13px;margin-top:4px}"+
      ".pa-back{background:none;border:none;color:"+p+";cursor:pointer;padding:4px 0;margin-bottom:12px;font-size:14px}"+
      ".pa-weekbar{display:flex;align-items:center;gap:8px;margin:8px 0 14px}"+
      ".pa-weekbar button{background:#fafafa;border:1px solid #e5e5e5;border-radius:8px;width:32px;height:32px;cursor:pointer;font-size:16px;line-height:1}"+
      ".pa-weekbar .pa-weeklabel{flex:1;text-align:center;font-weight:600;font-size:14px}"+
      ".pa-days{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-bottom:14px}"+
      ".pa-day{background:#fafafa;border:1px solid #e5e5e5;border-radius:10px;padding:8px 4px;text-align:center;cursor:pointer;font-size:12px;line-height:1.3}"+
      ".pa-day:hover{border-color:"+p+"}"+
      ".pa-day.pa-day--active{background:"+p+";color:#fff;border-color:"+p+"}"+
      ".pa-day .pa-dnum{font-weight:700;font-size:15px;display:block}"+
      ".pa-slots{display:grid;grid-template-columns:repeat(auto-fill,minmax(84px,1fr));gap:8px}"+
      ".pa-slot{background:#fafafa;border:1px solid #e5e5e5;border-radius:8px;padding:8px 4px;text-align:center;cursor:pointer;font-size:13px}"+
      ".pa-slot:hover{border-color:"+p+"}"+
      ".pa-empty{color:#888;font-size:13px;padding:12px;text-align:center;background:#fafafa;border-radius:10px}"+
      ".pa-form{display:grid;gap:10px;margin-top:8px}"+
      ".pa-form label{font-size:13px;color:#444;display:block;margin-bottom:4px}"+
      ".pa-form input,.pa-form textarea{width:100%;padding:10px 12px;border:1px solid #ccc;border-radius:8px;font-size:14px;font-family:inherit}"+
      ".pa-form textarea{min-height:70px;resize:vertical}"+
      ".pa-form input:focus,.pa-form textarea:focus{outline:none;border-color:"+p+"}"+
      ".pa-cta{background:"+p+";color:#fff;border:none;padding:12px 20px;border-radius:10px;font-size:15px;font-weight:600;cursor:pointer;margin-top:6px}"+
      ".pa-cta:disabled{opacity:.6;cursor:wait}"+
      ".pa-summary{background:#fafafa;border:1px solid #e5e5e5;border-radius:10px;padding:12px;font-size:14px;margin-bottom:12px}"+
      ".pa-err{background:#fee;border:1px solid #fcc;color:#900;padding:10px;border-radius:8px;font-size:13px;margin-bottom:10px}"+
      ".pa-ok{background:#efe;border:1px solid #cfc;color:#063;padding:14px;border-radius:10px;font-size:14px;text-align:center}"+
      ".pa-hp{position:absolute;left:-9999px;opacity:0}"+
      "@media (max-width:480px){.pa-days{grid-template-columns:repeat(7,1fr);gap:3px}.pa-day{font-size:11px;padding:6px 2px}.pa-slots{grid-template-columns:repeat(auto-fill,minmax(72px,1fr))}}";
    root.appendChild(style);
  }

  function h(tag, attrs, children){
    var el = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        if (k === "class") el.className = attrs[k];
        else if (k === "html") el.innerHTML = attrs[k];
        else if (k.indexOf("on")===0 && typeof attrs[k]==="function") el.addEventListener(k.slice(2), attrs[k]);
        else el.setAttribute(k, attrs[k]);
      }
    }
    if (children) {
      (Array.isArray(children)?children:[children]).forEach(function(c){
        if (c == null) return;
        el.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
      });
    }
    return el;
  }

  function mountOne(container){
    var instanceId = container.getAttribute("data-pacame-agenda");
    if (!instanceId) return;
    var primary = container.getAttribute("data-primary") || null;

    container.innerHTML = "";
    mountStyles(container, primary);

    var wrap = h("div",{class:"pa-wrap"});
    container.appendChild(wrap);

    var state = {
      business: null,
      services: [],
      selectedService: null,
      weekStart: startOfWeek(new Date()),
      selectedDay: null,
      slots: [],
      selectedSlot: null,
    };

    function render(){
      wrap.innerHTML = "";
      if (!state.services || !state.services.length) {
        wrap.appendChild(h("p",{class:"pa-sub"},"Cargando agenda..."));
        return;
      }
      if (!state.selectedService) return renderServiceList();
      if (!state.selectedSlot) return renderCalendar();
      return renderForm();
    }

    function renderServiceList(){
      wrap.appendChild(h("h3",{class:"pa-h"}, state.business && state.business.name ? ("Reserva en "+state.business.name) : "Reserva tu cita"));
      wrap.appendChild(h("p",{class:"pa-sub"},"Elige un servicio para continuar."));
      var list = h("div",{class:"pa-svc"});
      state.services.forEach(function(s){
        var btn = h("button",{type:"button", onclick:function(){ state.selectedService = s; state.selectedSlot = null; state.selectedDay = null; render(); fetchWeek(); }},[
          h("div",{class:"pa-row"},[
            h("div",null,[
              h("div",{class:"pa-name"}, s.name),
              h("div",{class:"pa-meta"}, s.duration_min + " min")
            ]),
            h("div",{class:"pa-price"}, formatEUR(s.price_cents))
          ]),
          s.description ? h("div",{class:"pa-desc"}, s.description) : null
        ]);
        list.appendChild(btn);
      });
      wrap.appendChild(list);
    }

    function renderCalendar(){
      wrap.appendChild(h("button",{class:"pa-back",type:"button",onclick:function(){ state.selectedService=null; render(); }}, "\u2190 Cambiar servicio"));
      wrap.appendChild(h("h3",{class:"pa-h"}, state.selectedService.name));
      wrap.appendChild(h("p",{class:"pa-sub"}, state.selectedService.duration_min+" min \u00b7 "+formatEUR(state.selectedService.price_cents)));

      var weekEnd = addDays(state.weekStart, 6);
      var label = fmtDayShort(state.weekStart)+" \u2013 "+fmtDayShort(weekEnd);
      var bar = h("div",{class:"pa-weekbar"},[
        h("button",{type:"button", onclick:function(){ state.weekStart = addDays(state.weekStart,-7); state.selectedDay=null; render(); fetchWeek(); }}, "\u2039"),
        h("div",{class:"pa-weeklabel"}, label),
        h("button",{type:"button", onclick:function(){ state.weekStart = addDays(state.weekStart,7); state.selectedDay=null; render(); fetchWeek(); }}, "\u203a"),
      ]);
      wrap.appendChild(bar);

      var daysByKey = {};
      state.slots.forEach(function(sl){
        var k = sl.start.slice(0,10); // YYYY-MM-DD (UTC). Para paleta simple OK.
        (daysByKey[k] = daysByKey[k] || []).push(sl);
      });

      var daysRow = h("div",{class:"pa-days"});
      for (var i=0;i<7;i++){
        var d = addDays(state.weekStart,i);
        var key = ymd(d);
        var has = !!daysByKey[key];
        var active = state.selectedDay === key;
        var cell = h("div",{
          class:"pa-day"+(active?" pa-day--active":""),
          style: has?"":"opacity:.4;cursor:default",
          onclick: has ? (function(k){ return function(){ state.selectedDay=k; render(); }; })(key) : null
        },[
          h("span",null, d.toLocaleDateString("es-ES",{weekday:"short"})),
          h("span",{class:"pa-dnum"}, String(d.getDate()))
        ]);
        daysRow.appendChild(cell);
      }
      wrap.appendChild(daysRow);

      if (!state.selectedDay){
        wrap.appendChild(h("div",{class:"pa-empty"},"Selecciona un dia con disponibilidad."));
        return;
      }

      var tz = state.business && state.business.timezone;
      var slots = daysByKey[state.selectedDay] || [];
      if (!slots.length){
        wrap.appendChild(h("div",{class:"pa-empty"},"No hay horarios para ese dia."));
        return;
      }
      var grid = h("div",{class:"pa-slots"});
      slots.forEach(function(sl){
        grid.appendChild(h("button",{type:"button",class:"pa-slot",onclick:function(){ state.selectedSlot = sl; render(); }}, fmtTime(sl.start, tz)));
      });
      wrap.appendChild(grid);
    }

    function renderForm(){
      wrap.appendChild(h("button",{class:"pa-back",type:"button",onclick:function(){ state.selectedSlot=null; render(); }}, "\u2190 Cambiar hora"));
      var tz = state.business && state.business.timezone;
      wrap.appendChild(h("div",{class:"pa-summary"},[
        h("div",null, state.selectedService.name + " \u00b7 " + state.selectedService.duration_min + " min"),
        h("div",{style:"margin-top:4px;font-weight:600"}, fmtFull(state.selectedSlot.start, tz))
      ]));

      var errorBox = h("div",{class:"pa-err",style:"display:none"});
      wrap.appendChild(errorBox);

      var form = h("form",{class:"pa-form", onsubmit:function(ev){
        ev.preventDefault();
        var payload = {
          instance_id: instanceId,
          service_slug: state.selectedService.slug,
          scheduled_at: state.selectedSlot.start,
          customer_name: form.elements.name.value.trim(),
          customer_email: form.elements.email.value.trim(),
          customer_phone: form.elements.phone.value.trim(),
          customer_notes: form.elements.notes.value.trim(),
          _hp: form.elements._hp.value
        };
        if (!payload.customer_name || !payload.customer_email){
          errorBox.textContent = "Rellena nombre y email.";
          errorBox.style.display = "block";
          return;
        }
        errorBox.style.display = "none";
        var btn = form.querySelector(".pa-cta");
        btn.disabled = true;
        btn.textContent = "Enviando...";
        fetchJSON(API_ORIGIN+"/api/apps/pacame-agenda/book",{
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body: JSON.stringify(payload)
        }).then(function(res){
          btn.disabled = false;
          btn.textContent = "Confirmar reserva";
          if (!res.ok){
            errorBox.textContent = (res.body && res.body.error) || "No se pudo crear la reserva.";
            errorBox.style.display = "block";
            return;
          }
          renderSuccess(res.body.booking);
        }).catch(function(){
          btn.disabled = false;
          btn.textContent = "Confirmar reserva";
          errorBox.textContent = "Error de red. Intentalo de nuevo.";
          errorBox.style.display = "block";
        });
      }},[
        h("div",null,[h("label",{for:"pa-name"},"Nombre completo *"), h("input",{id:"pa-name",name:"name",type:"text",required:"true",autocomplete:"name"})]),
        h("div",null,[h("label",{for:"pa-email"},"Email *"), h("input",{id:"pa-email",name:"email",type:"email",required:"true",autocomplete:"email"})]),
        h("div",null,[h("label",{for:"pa-phone"},"Telefono"), h("input",{id:"pa-phone",name:"phone",type:"tel",autocomplete:"tel"})]),
        h("div",null,[h("label",{for:"pa-notes"},"Notas (opcional)"), h("textarea",{id:"pa-notes",name:"notes"})]),
        // Honeypot
        h("div",{class:"pa-hp","aria-hidden":"true"},[h("label",{for:"pa-hp"},"No rellenar"), h("input",{id:"pa-hp",name:"_hp",type:"text",tabindex:"-1",autocomplete:"off"})]),
        h("button",{class:"pa-cta",type:"submit"},"Confirmar reserva")
      ]);
      wrap.appendChild(form);
    }

    function renderSuccess(booking){
      wrap.innerHTML = "";
      var tz = state.business && state.business.timezone;
      var msg = booking.status === "confirmed"
        ? "Tu reserva ha sido confirmada. Te hemos enviado un email con los detalles."
        : "Hemos recibido tu solicitud. Te confirmaremos por email en breve.";
      wrap.appendChild(h("div",{class:"pa-ok"},[
        h("div",{style:"font-size:32px;margin-bottom:6px"},"\u2713"),
        h("div",{style:"font-weight:700;margin-bottom:6px"}, msg),
        h("div",null, fmtFull(booking.scheduled_at, tz)),
        h("div",{style:"margin-top:8px;color:#666;font-size:12px"}, "Referencia: "+booking.booking_number)
      ]));
    }

    function fetchServices(){
      fetchJSON(API_ORIGIN+"/api/apps/pacame-agenda/services?instance_id="+encodeURIComponent(instanceId))
        .then(function(res){
          if (!res.ok){ wrap.innerHTML=""; wrap.appendChild(h("div",{class:"pa-err"}, (res.body && res.body.error) || "No se pudo cargar la agenda.")); return; }
          state.business = res.body.business;
          state.services = res.body.services || [];
          render();
        })
        .catch(function(){
          wrap.innerHTML = "";
          wrap.appendChild(h("div",{class:"pa-err"},"No se pudo conectar con la agenda."));
        });
    }

    function fetchWeek(){
      if (!state.selectedService) return;
      var from = ymd(state.weekStart);
      var to = ymd(addDays(state.weekStart,6));
      var url = API_ORIGIN+"/api/apps/pacame-agenda/availability?instance_id="+encodeURIComponent(instanceId)+"&service_slug="+encodeURIComponent(state.selectedService.slug)+"&from="+from+"&to="+to;
      state.slots = [];
      render();
      fetchJSON(url).then(function(res){
        state.slots = (res.ok && res.body.slots) || [];
        // Preseleccion: primer dia con slots.
        if (!state.selectedDay){
          for (var i=0;i<7;i++){
            var d = addDays(state.weekStart,i);
            var k = ymd(d);
            if (state.slots.some(function(sl){ return sl.start.slice(0,10)===k; })){ state.selectedDay = k; break; }
          }
        }
        render();
      });
    }

    fetchServices();
  }

  function mountAll(){
    var nodes = document.querySelectorAll("[data-pacame-agenda]");
    nodes.forEach(function(n){
      if (n.getAttribute("data-pa-mounted")) return;
      n.setAttribute("data-pa-mounted","1");
      try { mountOne(n); } catch(e){ /* swallow */ }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountAll);
  } else {
    mountAll();
  }
})();
`;
}

export async function GET(request: NextRequest) {
  // Origin = donde vive este servidor (para llamadas del widget desde otras webs).
  const proto = request.headers.get("x-forwarded-proto") || "https";
  const host = request.headers.get("host") || "pacameagencia.com";
  const origin = process.env.NEXT_PUBLIC_APP_URL || `${proto}://${host}`;

  const js = buildWidgetScript(origin);

  return new NextResponse(js, {
    status: 200,
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      ...CORS_HEADERS,
    },
  });
}

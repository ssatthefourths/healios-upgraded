var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-9w6vpQ/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// src/auth.ts
async function handleAuth(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json"
  };
  if (path === "/auth/signup" && method === "POST") {
    const { email, password, firstName, lastName } = await request.json();
    const id = crypto.randomUUID();
    const passwordHash = await hashPassword(password);
    try {
      await env.DB.prepare(
        "INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)"
      ).bind(id, email, passwordHash).run();
      await env.DB.prepare(
        "INSERT INTO profiles (id, first_name, last_name) VALUES (?, ?, ?)"
      ).bind(id, firstName, lastName).run();
      const sessionToken = await createSession(id, env);
      return new Response(JSON.stringify({ user: { id, email, first_name: firstName, last_name: lastName }, session: sessionToken }), {
        headers: corsHeaders
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: "User already exists or database error" }), { status: 400, headers: corsHeaders });
    }
  }
  if (path === "/auth/signin" && method === "POST") {
    const { email, password } = await request.json();
    const user = await env.DB.prepare(
      "SELECT id, email, password_hash FROM users WHERE email = ?"
    ).bind(email).first();
    if (!user || !await verifyPassword(password, user.password_hash)) {
      return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401, headers: corsHeaders });
    }
    const profile = await env.DB.prepare(
      "SELECT first_name, last_name FROM profiles WHERE id = ?"
    ).bind(user.id).first();
    const sessionToken = await createSession(user.id, env);
    return new Response(JSON.stringify({
      user: { id: user.id, email: user.email, ...profile },
      session: sessionToken
    }), { headers: corsHeaders });
  }
  if (path === "/auth/me" && method === "GET") {
    const token = request.headers.get("Authorization")?.split(" ").pop();
    if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    const userId = await env.SESSIONS.get(token);
    if (!userId) return new Response(JSON.stringify({ error: "Invalid session" }), { status: 401, headers: corsHeaders });
    const user = await env.DB.prepare(
      "SELECT id, email FROM users WHERE id = ?"
    ).bind(userId).first();
    const profile = await env.DB.prepare(
      "SELECT first_name, last_name FROM profiles WHERE id = ?"
    ).bind(userId).first();
    const roleData = await env.DB.prepare(
      "SELECT role FROM user_roles WHERE user_id = ?"
    ).bind(userId).first();
    return new Response(JSON.stringify({
      user: { ...user, ...profile, role: roleData?.role || "user" }
    }), { headers: corsHeaders });
  }
  if (path === "/auth/verify" && method === "GET") {
    const token = request.headers.get("Authorization")?.split(" ").pop();
    if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    const userId = await env.SESSIONS.get(token);
    if (!userId) return new Response(JSON.stringify({ error: "Invalid session" }), { status: 401, headers: corsHeaders });
    const user = await env.DB.prepare(
      "SELECT id, email FROM users WHERE id = ?"
    ).bind(userId).first();
    const profile = await env.DB.prepare(
      "SELECT first_name, last_name FROM profiles WHERE id = ?"
    ).bind(userId).first();
    return new Response(JSON.stringify({
      user: { id: user.id, email: user.email, ...profile }
    }), { headers: corsHeaders });
  }
  return new Response("Auth endpoint not found", { status: 404, headers: corsHeaders });
}
__name(handleAuth, "handleAuth");
async function hashPassword(password) {
  const msgUint8 = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(hashPassword, "hashPassword");
async function verifyPassword(password, hash) {
  return await hashPassword(password) === hash;
}
__name(verifyPassword, "verifyPassword");
async function createSession(userId, env) {
  const token = crypto.randomUUID();
  await env.SESSIONS.put(token, userId, { expirationTtl: 60 * 60 * 24 * 7 });
  return token;
}
__name(createSession, "createSession");

// src/products.ts
async function handleProducts(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json"
  };
  if ((path === "/categories" || path === "/categories/") && method === "GET") {
    const categories = await env.DB.prepare(
      "SELECT DISTINCT category FROM products WHERE is_published = 1"
    ).all();
    return new Response(JSON.stringify(categories.results.map((r) => r.category)), { headers: corsHeaders });
  }
  if (path === "/products" && method === "GET") {
    const category = url.searchParams.get("category");
    const limit = url.searchParams.get("limit") || "50";
    let query = "SELECT * FROM products WHERE is_published = 1";
    const params = [];
    if (category) {
      query += " AND category = ?";
      params.push(category);
    }
    query += " ORDER BY sort_order LIMIT ?";
    params.push(parseInt(limit));
    const products = await env.DB.prepare(query).bind(...params).all();
    return new Response(JSON.stringify(products.results), { headers: corsHeaders });
  }
  if (path.startsWith("/products/") && method === "GET") {
    const idOrSlug = path.split("/").pop();
    const product = await env.DB.prepare(
      "SELECT * FROM products WHERE (id = ? OR slug = ?) AND is_published = 1"
    ).bind(idOrSlug, idOrSlug).first();
    if (!product) {
      return new Response(JSON.stringify({ error: "Product not found" }), { status: 404, headers: corsHeaders });
    }
    return new Response(JSON.stringify(product), { headers: corsHeaders });
  }
  if (path === "/products" && method === "POST") {
    const data = await request.json();
    try {
      await env.DB.prepare(
        "INSERT INTO products (id, name, slug, price, image, category, description, sort_order, is_published) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
      ).bind(data.id, data.name, data.slug, data.price, data.image, data.category, data.description, data.sort_order || 0, data.is_published ? 1 : 0).run();
      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 400, headers: corsHeaders });
    }
  }
  if (path.startsWith("/products/") && method === "PUT") {
    const id = path.split("/").pop();
    const data = await request.json();
    try {
      await env.DB.prepare(
        "UPDATE products SET name = ?, slug = ?, price = ?, image = ?, category = ?, description = ?, sort_order = ?, is_published = ? WHERE id = ?"
      ).bind(data.name, data.slug, data.price, data.image, data.category, data.description, data.sort_order, data.is_published ? 1 : 0, id).run();
      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 400, headers: corsHeaders });
    }
  }
  if (path.startsWith("/products/") && method === "DELETE") {
    const id = path.split("/").pop();
    await env.DB.prepare("DELETE FROM products WHERE id = ?").bind(id).run();
    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
  }
  return new Response("Products endpoint not found", { status: 404, headers: corsHeaders });
}
__name(handleProducts, "handleProducts");

// src/orders.ts
async function handleOrders(request, env) {
  const method = request.method;
  const corsHeaders = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };
  if (method === "POST") {
    return new Response(JSON.stringify({ message: "Order creation endpoint" }), { headers: corsHeaders });
  }
  return new Response("Orders endpoint not found", { status: 404, headers: corsHeaders });
}
__name(handleOrders, "handleOrders");

// src/index.ts
var src_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    };
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }
    try {
      if (path.startsWith("/auth")) {
        return await handleAuth(request, env);
      }
      if (path.startsWith("/products")) {
        return await handleProducts(request, env);
      }
      if (path === "/categories" || path === "/categories/") {
        return await handleProducts(request, env);
      }
      if (path.startsWith("/orders")) {
        return await handleOrders(request, env);
      }
      return new Response("Healios API - Not Found", { status: 404, headers: corsHeaders });
    } catch (err) {
      console.error(err);
      return new Response(JSON.stringify({ error: err.message || "Internal Server Error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  }
};

// ../../../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// .wrangler/tmp/bundle-9w6vpQ/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default
];
var middleware_insertion_facade_default = src_default;

// ../../../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-9w6vpQ/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map

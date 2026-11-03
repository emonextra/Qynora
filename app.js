/* Qynora frontend application. Keep features in separate modules as project grows. */
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const money = n => "৳" + Number(n || 0).toLocaleString("bn-BD");
  let supabase = null, currentUser = null, authMode = "login";
  let products = [], cart = JSON.parse(localStorage.getItem("qynora_cart") || "[]");
  let categories = [];

  function notify(message) {
    const toast = $("toast"); toast.textContent = message; toast.style.display = "block";
    clearTimeout(window.__qynoraToast); window.__qynoraToast = setTimeout(() => toast.style.display = "none", 2600);
  }
  function setAuthMessage(message) { $("auth-message").textContent = message; }
  function showModal(id) { $(id).classList.add("open"); }
  function hideModal(id) { $(id).classList.remove("open"); }

  function initSupabase() {
    const cfg = window.QYNORA_CONFIG || {};
    if (!window.supabase || !cfg.SUPABASE_URL || !cfg.SUPABASE_PUBLISHABLE_KEY) {
      $("catalog-message").textContent = "Supabase configuration পাওয়া যায়নি। assets/js/config.js পরীক্ষা করো।";
      return;
    }
    supabase = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_PUBLISHABLE_KEY);
    supabase.auth.onAuthStateChange((_event, session) => {
      currentUser = session?.user || null;
      updateAccountButton();
    });
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) console.warn(error);
      currentUser = data?.session?.user || null; updateAccountButton();
    });
  }

  function updateAccountButton() {
    $("account-button").textContent = currentUser ? "লগআউট" : "লগইন";
  }

  async function loadCatalog() {
    if (!supabase) return;
    $("catalog-message").textContent = "ডেটাবেস থেকে পণ্য লোড হচ্ছে...";
    // Expected products columns: id, name, description, price, image_url, category_id, status, shop_id.
    // Expected shops columns: id, status. Public RLS must allow active products of approved shops.
    const { data, error } = await supabase
      .from("products")
      .select("id,name,description,price,image_url,category_id,status,shop_id,shops!inner(status)")
      .eq("status", "active")
      .eq("shops.status", "approved")
      .order("created_at", { ascending: false })
      .limit(48);
    if (error) {
      console.error("Product query:", error);
      $("catalog-message").textContent = "পণ্য লোড হয়নি। products/shops কলাম ও RLS policy মিলিয়ে দেখতে হবে।";
      $("product-grid").innerHTML = '<div class="empty">ডেটাবেস থেকে পণ্য পাওয়া যায়নি। Supabase schema যাচাই করো।</div>';
      return;
    }
    products = data || [];
    const { data: cats, error: catError } = await supabase.from("categories").select("*").order("name");
    if (!catError && cats) {
      categories = cats;
      const filter = $("category-filter");
      filter.innerHTML = '<option value="">সব ক্যাটাগরি</option>' + cats.map(c => `<option value="${escapeHtml(String(c.id))}">${escapeHtml(c.name || c.title || "ক্যাটাগরি")}</option>`).join("");
    }
    renderProducts();
    $("catalog-message").textContent = products.length ? `${products.length}টি পণ্য দেখানো হচ্ছে` : "এখনো কোনো অনুমোদিত সক্রিয় পণ্য নেই।";
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
  }
  function renderProducts() {
    const term = $("search-input").value.trim().toLowerCase();
    const category = $("category-filter").value;
    const list = products.filter(p => (!category || String(p.category_id) === category) &&
      (`${p.name || ""} ${p.description || ""}`.toLowerCase().includes(term)));
    $("product-grid").innerHTML = list.length ? list.map(p => `
      <article class="product-card">
        <div class="product-image">${p.image_url ? `<img src="${escapeHtml(p.image_url)}" alt="" style="width:100%;height:100%;object-fit:cover">` : "🛍️"}</div>
        <div class="product-body">
          <h3>${escapeHtml(p.name || "নামহীন পণ্য")}</h3>
          <div class="product-meta">Qynora বিক্রেতা</div>
          <div class="product-price">${money(p.price)}</div>
          <button class="button primary add-cart" data-id="${escapeHtml(p.id)}">কার্টে যোগ করুন</button>
        </div>
      </article>`).join("") : '<div class="empty">মিল পাওয়া যায়নি অথবা এখনো কোনো পণ্য প্রকাশিত হয়নি।</div>';
    document.querySelectorAll(".add-cart").forEach(btn => btn.addEventListener("click", () => addToCart(btn.dataset.id)));
  }

  function addToCart(id) {
    const item = cart.find(x => String(x.id) === String(id));
    if (item) item.qty++; else cart.push({ id, qty: 1 });
    saveCart(); notify("কার্টে যোগ হয়েছে");
  }
  function saveCart() {
    localStorage.setItem("qynora_cart", JSON.stringify(cart));
    $("cart-count").textContent = cart.reduce((sum, x) => sum + x.qty, 0);
  }
  function renderCart() {
    let total = 0;
    $("cart-items").innerHTML = cart.length ? cart.map(item => {
      const p = products.find(x => String(x.id) === String(item.id));
      if (!p) return "";
      total += Number(p.price || 0) * item.qty;
      return `<div class="cart-row"><div><b>${escapeHtml(p.name)}</b><div class="muted">${money(p.price)} × ${item.qty}</div></div><div><button data-id="${escapeHtml(item.id)}" data-delta="-1">−</button> ${item.qty} <button data-id="${escapeHtml(item.id)}" data-delta="1">+</button></div></div>`;
    }).join("") : '<div class="empty">কার্ট খালি।</div>';
    $("cart-total").textContent = money(total);
    document.querySelectorAll("#cart-items button[data-id]").forEach(btn => btn.addEventListener("click", () => {
      const item = cart.find(x => String(x.id) === btn.dataset.id);
      if (item) item.qty += Number(btn.dataset.delta);
      cart = cart.filter(x => x.qty > 0); saveCart(); renderCart();
    }));
  }

  async function submitAuth(event) {
    event.preventDefault(); setAuthMessage("");
    if (!supabase) return setAuthMessage("Supabase সংযোগ নেই।");
    const email = $("auth-email").value.trim(), password = $("auth-password").value;
    $("auth-submit").disabled = true;
    try {
      if (authMode === "signup") {
        const name = $("auth-name").value.trim();
        const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });
        if (error) throw error;
        setAuthMessage("সাইনআপ অনুরোধ হয়েছে। ইমেইল ভেরিফিকেশন চাইলে ইনবক্স দেখো।");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setAuthMessage("লগইন সফল হয়েছে।"); hideModal("auth-modal"); notify("স্বাগতম!");
      }
    } catch (err) {
      setAuthMessage(err.message || "অনুরোধ সম্পন্ন হয়নি।");
    } finally { $("auth-submit").disabled = false; }
  }

  function setAuthMode(mode) {
    authMode = mode;
    $("login-tab").classList.toggle("active", mode === "login");
    $("signup-tab").classList.toggle("active", mode === "signup");
    $("name-wrap").classList.toggle("hidden", mode !== "signup");
    $("auth-submit").textContent = mode === "signup" ? "অ্যাকাউন্ট তৈরি" : "লগইন";
    $("auth-password").autocomplete = mode === "signup" ? "new-password" : "current-password";
    setAuthMessage("");
  }

  async function accountAction() {
    if (!currentUser) { showModal("auth-modal"); return; }
    if (!confirm("লগআউট করতে চাও?")) return;
    const { error } = await supabase.auth.signOut();
    if (error) notify(error.message); else { currentUser = null; updateAccountButton(); notify("লগআউট হয়েছে"); }
  }

  function bindEvents() {
    $("account-button").addEventListener("click", accountAction);
    $("cart-button").addEventListener("click", () => { renderCart(); $("cart-drawer").classList.add("open"); });
    $("search-form").addEventListener("submit", e => { e.preventDefault(); renderProducts(); });
    $("search-input").addEventListener("input", renderProducts);
    $("category-filter").addEventListener("change", renderProducts);
    $("login-tab").addEventListener("click", () => setAuthMode("login"));
    $("signup-tab").addEventListener("click", () => setAuthMode("signup"));
    $("auth-form").addEventListener("submit", submitAuth);
    $("seller-info-button").addEventListener("click", () => notify("Seller application ও approval module পরবর্তী ধাপে যুক্ত হবে।"));
    document.querySelectorAll("[data-close]").forEach(btn => btn.addEventListener("click", () => {
      const id = btn.dataset.close; $(id).classList.remove("open");
    }));
    $("auth-modal").addEventListener("click", e => { if (e.target.id === "auth-modal") hideModal("auth-modal"); });
    $("cart-drawer").addEventListener("click", e => { if (e.target.id === "cart-drawer") hideModal("cart-drawer"); });
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("year").textContent = new Date().getFullYear();
    bindEvents(); initSupabase(); saveCart();
    // Supabase client is initialized synchronously above; load after it exists.
    if (supabase) loadCatalog();
  });
})();
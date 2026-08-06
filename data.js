/* Motor de datos: todas las operaciones quedan persistidas en localStorage. */
const NutivaData = (() => {
  const KEY = 'nutiva-manager-v1';
  const initial = { products: [], supplies: [], recipes: [], productions: [], sales: [], expenses: [], tasks: [], history: [] };
  let state;
  const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  const now = () => new Date().toISOString();
  const load = () => { try { return { ...initial, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return structuredClone(initial); } };
  const save = () => localStorage.setItem(KEY, JSON.stringify(state));
  const addHistory = (type, title, detail, amount = null) => state.history.unshift({ id: uid(), type, title, detail, amount, date: now() });
  const grams = supply => Number(supply.quantity) * (supply.unit === 'kg' ? 1000 : 1);
  const unitCost = supply => Number(supply.unitPrice ?? (Number(supply.price) / grams(supply)));
  const recipeCost = recipe => (recipe.items || []).reduce((total, item) => { const supply = state.supplies.find(s => s.id === item.supplyId); return total + (supply ? unitCost(supply) * Number(item.grams) : 0); }, 0);
  const getProduct = id => state.products.find(x => x.id === id);
  const getRecipe = id => state.recipes.find(x => x.id === id);
  const productStock = id => state.productions.filter(x => x.productId === id).reduce((n, x) => n + Number(x.quantity), 0) - state.sales.filter(x => x.productId === id).reduce((n, x) => n + Number(x.quantity), 0);
  const monthKey = date => new Date(date).toISOString().slice(0, 7);
  function mutate(fn) { fn(); save(); document.dispatchEvent(new CustomEvent('nutiva:changed', { detail: structuredClone(state) })); }
  function addProduct(input) { mutate(() => { const p = { id: uid(), name: input.name.trim(), salePrice: Number(input.salePrice || 0), stockTarget: Number(input.stockTarget || 0), createdAt: now() }; state.products.push(p); addHistory('Producto', `Nuevo producto: ${p.name}`, 'Producto agregado'); }); }
  function addSupply(input) { mutate(() => { const qty = Number(input.quantity), price = Number(input.price); const s = { id: uid(), name: input.name.trim(), quantity: qty, unit: input.unit, price, unitPrice: price / (qty * (input.unit === 'kg' ? 1000 : 1)), createdAt: now() }; state.supplies.push(s); addHistory('Compra', `Compra de ${s.name}`, `${s.quantity} ${s.unit}`, s.price); }); }
  function addRecipe(input) { mutate(() => { const r = { id: uid(), name: input.name.trim(), productId: input.productId, yield: Number(input.yield), items: input.items, createdAt: now() }; state.recipes.push(r); addHistory('Receta', `Receta guardada: ${r.name}`, `${r.yield} unidades por tanda`); }); }
  function produce(input) { const recipe = getRecipe(input.recipeId); if (!recipe) throw Error('Elegí una receta.'); const product = getProduct(recipe.productId); const multiplier = Number(input.quantity) / Number(recipe.yield); if (!Number.isFinite(multiplier) || multiplier <= 0) throw Error('Ingresá una cantidad válida.'); for (const item of recipe.items) { const s = state.supplies.find(x => x.id === item.supplyId); if (!s || grams(s) < Number(item.grams) * multiplier) throw Error(`Stock insuficiente de ${s?.name || 'un insumo'}.`); } const cost = recipeCost(recipe) * multiplier; mutate(() => { recipe.items.forEach(item => { const s = state.supplies.find(x => x.id === item.supplyId); s.quantity = (grams(s) - Number(item.grams) * multiplier) / (s.unit === 'kg' ? 1000 : 1); }); state.productions.push({ id: uid(), recipeId: recipe.id, productId: product.id, quantity: Number(input.quantity), cost, date: input.date, createdAt: now() }); addHistory('Producción', `Producción de ${product.name}`, `${input.quantity} unidades`, cost); }); }
  function addSale(input) { const product = getProduct(input.productId); if (!product) throw Error('Elegí un producto.'); if (productStock(product.id) < Number(input.quantity)) throw Error('No hay stock suficiente para registrar esta venta.'); mutate(() => { const s = { id: uid(), productId: product.id, client: input.client.trim() || 'Consumidor final', quantity: Number(input.quantity), price: Number(input.price), payment: input.payment, date: input.date, notes: input.notes.trim(), createdAt: now() }; state.sales.push(s); addHistory('Venta', `Venta: ${product.name}`, `${s.quantity} unidades · ${s.client}`, s.price); }); }
  function addExpense(input) { mutate(() => { const e = { id: uid(), category: input.category, description: input.description.trim(), amount: Number(input.amount), date: input.date, createdAt: now() }; state.expenses.push(e); addHistory('Gasto', e.description || e.category, e.category, e.amount); }); }
  function addTask(text) { mutate(() => state.tasks.push({ id: uid(), text: text.trim(), done: false, createdAt: now() })); }
  function toggleTask(id) { mutate(() => { const t = state.tasks.find(x => x.id === id); if (t) t.done = !t.done; }); }
  function remove(collection, id) { mutate(() => { state[collection] = state[collection].filter(x => x.id !== id); }); }
  function metrics() { const sales = state.sales; const expenses = state.expenses; const supplies = state.supplies; const productions = state.productions; const revenue = sales.reduce((n, x) => n + x.price, 0); const productionCost = productions.reduce((n, x) => n + x.cost, 0); const operatingExpenses = expenses.reduce((n, x) => n + x.amount, 0); const supplyInvestment = supplies.reduce((n, x) => n + x.price, 0); const units = sales.reduce((n, x) => n + x.quantity, 0); return { revenue, productionCost, operatingExpenses, supplyInvestment, cashBalance: revenue - supplyInvestment - operatingExpenses, stock: state.products.reduce((n,p) => n + productStock(p.id), 0), avgCost: productions.reduce((n,x)=>n+x.quantity,0) ? productionCost / productions.reduce((n,x)=>n+x.quantity,0) : 0, avgPrice: units ? revenue / units : 0 }; }
  state = load();
  function replace(next) { state = { ...initial, ...next }; save(); }
  return { get state() { return state; }, save, replace, addProduct, addSupply, addRecipe, produce, addSale, addExpense, addTask, toggleTask, remove, recipeCost, productStock, metrics, getProduct, getRecipe, grams, unitCost, addHistory };
})();

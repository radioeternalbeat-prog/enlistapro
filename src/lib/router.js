// ============================================
// EN LISTA! — Simple Client-Side Router
// ============================================

class Router {
  constructor() {
    this.routes = {};
    this.currentView = null;
  }

  register(name, renderFn) {
    this.routes[name] = renderFn;
  }

  navigate(viewName, params = {}) {
    const renderFn = this.routes[viewName];
    if (!renderFn) {
      console.error(`View "${viewName}" not found`);
      return;
    }
    
    this.currentView = viewName;
    const app = document.getElementById('app');
    app.innerHTML = '';
    renderFn(app, params);
  }
}

export const router = new Router();
export default router;

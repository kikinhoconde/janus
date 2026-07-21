// JANUS: Central Privada Patrimonial - v1.0
// Sistema de Gestão de Patrimônio

class JanusApp {
  constructor() {
    this.currentUser = null;
    this.isLoading = false;
    this.currentPage = 'dashboard';
    this.patrimonio = [];
    this.investimentos = [];
    this.initApp();
  }

  async initApp() {
    try {
      const { data, error } = await supabaseClient.auth.getSession();
      if (data.session) {
        this.currentUser = data.session.user;
        await this.loadUserData();
        this.renderDashboard();
      } else {
        this.renderLogin();
      }
      this.setupAuthListener();
    } catch (error) {
      console.error('Erro ao inicializar app:', error);
      this.renderLogin();
    }
  }

  setupAuthListener() {
    supabaseClient.auth.onAuthStateChange((event, session) => {
      if (session) {
        this.currentUser = session.user;
        this.loadUserData();
        this.renderDashboard();
      } else {
        this.currentUser = null;
        this.renderLogin();
      }
    });
  }

  async loadUserData() {
    if (!this.currentUser) return;

    try {
      // Carregar patrimônio
      const { data: patrimonio, error: errPatrimonio } = await supabaseClient
        .from('patrimonio')
        .select('*')
        .eq('user_id', this.currentUser.id);

      if (!errPatrimonio) this.patrimonio = patrimonio || [];

      // Carregar investimentos
      const { data: investimentos, error: errInvestimentos } = await supabaseClient
        .from('investimentos')
        .select('*')
        .eq('user_id', this.currentUser.id);

      if (!errInvestimentos) this.investimentos = investimentos || [];
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  }

  renderLogin() {
    const appDiv = document.getElementById('app');
    appDiv.innerHTML = `
      <div class="auth-container">
        <div class="auth-card">
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="logo">
            <rect width="100" height="100" fill="none" stroke="#B58A47" stroke-width="2"/>
            <text x="50" y="55" font-size="48" font-weight="bold" fill="#B58A47" text-anchor="middle">J</text>
          </svg>

          <h1>JANUS</h1>
          <p class="subtitle">CENTRAL PRIVADA PATRIMONIAL</p>

          <div class="tabs">
            <button class="tab-btn active" onclick="app.switchTab('login')">Entrar</button>
            <button class="tab-btn" onclick="app.switchTab('signup')">Criar Conta</button>
          </div>

          <form id="loginForm" class="auth-form">
            <input type="email" placeholder="E-mail" required class="auth-input">
            <input type="password" placeholder="Senha" required class="auth-input">
            <button type="submit" class="auth-button">Entrar</button>
          </form>

          <form id="signupForm" class="auth-form hidden">
            <input type="email" placeholder="E-mail" required class="auth-input">
            <input type="password" placeholder="Senha (mín. 6 caracteres)" required minlength="6" class="auth-input">
            <input type="password" placeholder="Confirmar senha" required class="auth-input">
            <button type="submit" class="auth-button">Criar Conta</button>
          </form>

          <div class="error-container" id="errorContainer"></div>
        </div>
      </div>
    `;

    document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
    document.getElementById('signupForm').addEventListener('submit', (e) => this.handleSignup(e));
  }

  switchTab(tabName) {
    document.querySelectorAll('.auth-form').forEach(f => f.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));

    if (tabName === 'login') {
      document.getElementById('loginForm').classList.remove('hidden');
    } else {
      document.getElementById('signupForm').classList.remove('hidden');
    }

    event.target.classList.add('active');
  }

  showError(message) {
    const errorDiv = document.getElementById('errorContainer');
    if (errorDiv) {
      errorDiv.innerHTML = `<div class="error-message">${message}</div>`;
      setTimeout(() => {
        if (errorDiv) errorDiv.innerHTML = '';
      }, 5000);
    }
  }

  async handleLogin(event) {
    event.preventDefault();
    const form = event.target;
    const email = form.querySelector('input[type="email"]').value;
    const password = form.querySelector('input[type="password"]').value;

    try {
      const button = form.querySelector('button');
      button.disabled = true;
      button.textContent = 'Entrando...';

      const { error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        this.showError(error.message || 'Erro ao fazer login');
        button.disabled = false;
        button.textContent = 'Entrar';
      }
    } catch (error) {
      this.showError(error.message);
    }
  }

  async handleSignup(event) {
    event.preventDefault();
    const form = event.target;
    const inputs = form.querySelectorAll('input');
    const email = inputs[0].value;
    const password = inputs[1].value;
    const passwordConfirm = inputs[2].value;

    if (password !== passwordConfirm) {
      this.showError('As senhas não correspondem');
      return;
    }

    if (password.length < 6) {
      this.showError('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    try {
      const button = form.querySelector('button');
      button.disabled = true;
      button.textContent = 'Criando conta...';

      const { error } = await supabaseClient.auth.signUp({
        email,
        password
      });

      if (error) {
        this.showError(error.message || 'Erro ao criar conta');
        button.disabled = false;
        button.textContent = 'Criar Conta';
      } else {
        this.showError('Conta criada! Faça login para continuar.');
        form.reset();
        setTimeout(() => this.switchTab('login'), 2000);
      }
    } catch (error) {
      this.showError(error.message);
    }
  }

  renderDashboard() {
    const appDiv = document.getElementById('app');
    const patrimônioTotal = this.calcularTotalPatrimonio();
    const investimentosTotal = this.calcularTotalInvestimentos();
    const totalGeral = patrimônioTotal + investimentosTotal;

    appDiv.innerHTML = `
      <div class="dashboard-container">
        <div class="navbar">
          <div class="navbar-left">
            <h1 class="navbar-title">JANUS</h1>
          </div>
          <div class="navbar-right">
            <span class="user-email">${this.currentUser.email}</span>
            <button onclick="app.handleLogout()" class="logout-btn">Sair</button>
          </div>
        </div>

        <div class="sidebar">
          <button class="nav-btn active" onclick="app.goToPage('dashboard')">📊 Dashboard</button>
          <button class="nav-btn" onclick="app.goToPage('patrimonio')">🏠 Patrimônio</button>
          <button class="nav-btn" onclick="app.goToPage('investimentos')">📈 Investimentos</button>
        </div>

        <div class="main-content">
          <div id="dashboard-page" class="page active">
            <h2>Resumo do Patrimônio</h2>

            <div class="summary-cards">
              <div class="card">
                <h3>Patrimônio</h3>
                <p class="card-value">R$ ${patrimônioTotal.toFixed(2).replace('.', ',')}</p>
                <span class="card-items">${this.patrimonio.length} bens</span>
              </div>

              <div class="card">
                <h3>Investimentos</h3>
                <p class="card-value">R$ ${investimentosTotal.toFixed(2).replace('.', ',')}</p>
                <span class="card-items">${this.investimentos.length} investimentos</span>
              </div>

              <div class="card highlight">
                <h3>Total</h3>
                <p class="card-value">R$ ${totalGeral.toFixed(2).replace('.', ',')}</p>
                <span class="card-items">Patrimônio consolidado</span>
              </div>
            </div>

            <div class="chart-container">
              <h3>Distribuição do Patrimônio</h3>
              <canvas id="patrimonioPie"></canvas>
            </div>

            <div class="recent-items">
              <h3>Últimas Adições</h3>
              ${this.patrimonio.length > 0 ? `
                <div class="items-list">
                  ${this.patrimonio.slice(-3).reverse().map(item => `
                    <div class="item-row">
                      <span>${item.descricao}</span>
                      <span>R$ ${item.valor.toFixed(2).replace('.', ',')}</span>
                    </div>
                  `).join('')}
                </div>
              ` : '<p class="empty-state">Nenhum patrimônio adicionado ainda</p>'}
            </div>
          </div>

          <div id="patrimonio-page" class="page">
            <h2>Gestão de Patrimônio</h2>

            <div class="form-container">
              <h3>Adicionar Bem</h3>
              <form id="patrimonioForm">
                <input type="text" placeholder="Tipo (ex: Imóvel, Veículo)" required class="form-input">
                <input type="text" placeholder="Descrição" required class="form-input">
                <input type="number" placeholder="Valor" step="0.01" required class="form-input">
                <button type="submit" class="form-button">Adicionar</button>
              </form>
            </div>

            <div class="items-container">
              <h3>Meus Bens</h3>
              ${this.patrimonio.length > 0 ? `
                <table class="items-table">
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th>Descrição</th>
                      <th>Valor</th>
                      <th>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${this.patrimonio.map((item, i) => `
                      <tr>
                        <td>${item.tipo}</td>
                        <td>${item.descricao}</td>
                        <td>R$ ${item.valor.toFixed(2).replace('.', ',')}</td>
                        <td><button class="delete-btn" onclick="app.deletePatrimonio('${item.id}')">Deletar</button></td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              ` : '<p class="empty-state">Nenhum patrimônio adicionado ainda</p>'}
            </div>
          </div>

          <div id="investimentos-page" class="page">
            <h2>Carteira de Investimentos</h2>

            <div class="form-container">
              <h3>Adicionar Investimento</h3>
              <form id="investimentosForm">
                <input type="text" placeholder="Tipo (ex: Ação, Fundo, Cripto)" required class="form-input">
                <input type="text" placeholder="Descrição/Ticker" required class="form-input">
                <input type="number" placeholder="Quantidade" step="0.0001" required class="form-input">
                <input type="number" placeholder="Valor Unitário" step="0.01" required class="form-input">
                <input type="number" placeholder="Rentabilidade (%)" step="0.01" class="form-input">
                <input type="date" required class="form-input">
                <button type="submit" class="form-button">Adicionar</button>
              </form>
            </div>

            <div class="items-container">
              <h3>Meus Investimentos</h3>
              ${this.investimentos.length > 0 ? `
                <table class="items-table">
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th>Descrição</th>
                      <th>Quantidade</th>
                      <th>Valor Total</th>
                      <th>Rentabilidade</th>
                      <th>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${this.investimentos.map(inv => `
                      <tr>
                        <td>${inv.tipo}</td>
                        <td>${inv.descricao}</td>
                        <td>${inv.quantidade.toFixed(4)}</td>
                        <td>R$ ${inv.valor_total.toFixed(2).replace('.', ',')}</td>
                        <td><span class="${inv.rentabilidade >= 0 ? 'positive' : 'negative'}">${inv.rentabilidade.toFixed(2)}%</span></td>
                        <td><button class="delete-btn" onclick="app.deleteInvestimento('${inv.id}')">Deletar</button></td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              ` : '<p class="empty-state">Nenhum investimento adicionado ainda</p>'}
            </div>
          </div>
        </div>
      </div>
    `;

    // Attach event listeners
    document.getElementById('patrimonioForm').addEventListener('submit', (e) => this.addPatrimonio(e));
    document.getElementById('investimentosForm').addEventListener('submit', (e) => this.addInvestimento(e));

    // Render chart if in dashboard
    if (this.currentPage === 'dashboard') {
      this.renderChart();
    }
  }

  calcularTotalPatrimonio() {
    return this.patrimonio.reduce((sum, item) => sum + parseFloat(item.valor || 0), 0);
  }

  calcularTotalInvestimentos() {
    return this.investimentos.reduce((sum, inv) => sum + parseFloat(inv.valor_total || 0), 0);
  }

  async addPatrimonio(event) {
    event.preventDefault();
    const form = event.target;
    const inputs = form.querySelectorAll('input');

    const tipo = inputs[0].value;
    const descricao = inputs[1].value;
    const valor = parseFloat(inputs[2].value);

    try {
      const { error } = await supabaseClient
        .from('patrimonio')
        .insert([{
          user_id: this.currentUser.id,
          tipo,
          descricao,
          valor
        }]);

      if (error) {
        this.showError('Erro ao adicionar patrimônio');
      } else {
        form.reset();
        await this.loadUserData();
        this.renderDashboard();
      }
    } catch (error) {
      this.showError(error.message);
    }
  }

  async addInvestimento(event) {
    event.preventDefault();
    const form = event.target;
    const inputs = form.querySelectorAll('input');

    const tipo = inputs[0].value;
    const descricao = inputs[1].value;
    const quantidade = parseFloat(inputs[2].value);
    const valor_unitario = parseFloat(inputs[3].value);
    const rentabilidade = parseFloat(inputs[4].value) || 0;
    const data_compra = inputs[5].value;
    const valor_total = quantidade * valor_unitario;

    try {
      const { error } = await supabaseClient
        .from('investimentos')
        .insert([{
          user_id: this.currentUser.id,
          tipo,
          descricao,
          quantidade,
          valor_unitario,
          valor_total,
          rentabilidade,
          data_compra
        }]);

      if (error) {
        this.showError('Erro ao adicionar investimento');
      } else {
        form.reset();
        await this.loadUserData();
        this.renderDashboard();
      }
    } catch (error) {
      this.showError(error.message);
    }
  }

  async deletePatrimonio(id) {
    if (!confirm('Tem certeza que deseja deletar este bem?')) return;

    try {
      const { error } = await supabaseClient
        .from('patrimonio')
        .delete()
        .eq('id', id);

      if (error) {
        this.showError('Erro ao deletar patrimônio');
      } else {
        await this.loadUserData();
        this.renderDashboard();
      }
    } catch (error) {
      this.showError(error.message);
    }
  }

  async deleteInvestimento(id) {
    if (!confirm('Tem certeza que deseja deletar este investimento?')) return;

    try {
      const { error } = await supabaseClient
        .from('investimentos')
        .delete()
        .eq('id', id);

      if (error) {
        this.showError('Erro ao deletar investimento');
      } else {
        await this.loadUserData();
        this.renderDashboard();
      }
    } catch (error) {
      this.showError(error.message);
    }
  }

  goToPage(page) {
    this.currentPage = page;

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`${page}-page`).classList.add('active');

    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');

    if (page === 'dashboard') {
      setTimeout(() => this.renderChart(), 100);
    }
  }

  renderChart() {
    const canvas = document.getElementById('patrimonioPie');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const tipos = {};

    this.patrimonio.forEach(item => {
      tipos[item.tipo] = (tipos[item.tipo] || 0) + parseFloat(item.valor);
    });

    const labels = Object.keys(tipos);
    const data = Object.values(tipos);
    const colors = ['#B58A47', '#D4A574', '#8B6F47', '#E8C5A0', '#6B4F28'];

    // Simple pie chart using canvas
    const total = data.reduce((a, b) => a + b, 0);
    let currentAngle = 0;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    data.forEach((value, index) => {
      const sliceAngle = (value / total) * 2 * Math.PI;

      ctx.fillStyle = colors[index % colors.length];
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, canvas.height / 2);
      ctx.arc(canvas.width / 2, canvas.height / 2, 100, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fill();

      currentAngle += sliceAngle;
    });
  }

  async handleLogout() {
    if (!confirm('Tem certeza que deseja sair?')) return;

    try {
      await supabaseClient.auth.signOut();
      this.currentUser = null;
      this.renderLogin();
    } catch (error) {
      this.showError(error.message);
    }
  }
}

// Inicializar app
const app = new JanusApp();

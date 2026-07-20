// JANUS — Aplicação Web
class JanusApp {
    constructor() {
        this.currentUser = null;
        this.isLoading = false;
        this.initApp();
    }

    async initApp() {
        // Verificar se há sessão ativa
        try {
            const { data: { session } } = await supabaseClient.auth.getSession();
            if (session) {
                this.currentUser = session.user;
                this.renderDashboard();
            } else {
                this.renderLogin();
            }
        } catch (err) {
            window.console.error('Erro ao verificar sessão:', err);
            this.renderLogin();
        }

        // Monitorar mudanças de autenticação
        supabaseClient.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                this.currentUser = session.user;
                this.renderDashboard();
            } else if (event === 'SIGNED_OUT') {
                this.currentUser = null;
                this.renderLogin();
            }
        });
    }

    renderLogin() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="auth-container">
                <div class="auth-card">
                    <div class="auth-logo">
                        <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
                            <!-- Placeholder para logo -->
                            <text x="50%" y="50%" text-anchor="middle" dy="0.3em" font-size="40" font-weight="bold" fill="#B58A47">
                                JANUS
                            </text>
                        </svg>
                    </div>

                    <div class="auth-title">JANUS</div>
                    <div class="auth-subtitle">Central Privada Patrimonial</div>

                    <div class="error-message" id="errorMessage"></div>

                    <div class="auth-tabs">
                        <button class="auth-tab active" onclick="app.switchTab('login')">Entrar</button>
                        <button class="auth-tab" onclick="app.switchTab('signup')">Criar Conta</button>
                    </div>

                    <!-- FORM LOGIN -->
                    <form id="loginForm" class="auth-form active" onsubmit="app.handleLogin(event)">
                        <div class="field">
                            <label for="email">E-mail</label>
                            <input type="email" id="email" placeholder="seu@email.com" required>
                        </div>
                        <div class="field">
                            <label for="password">Senha</label>
                            <input type="password" id="password" placeholder="Mínimo 6 caracteres" required>
                        </div>
                        <button type="submit" class="btn btn-primary" id="loginBtn">Entrar</button>
                    </form>

                    <!-- FORM SIGNUP -->
                    <form id="signupForm" class="auth-form" onsubmit="app.handleSignup(event)">
                        <div class="field">
                            <label for="signupEmail">E-mail</label>
                            <input type="email" id="signupEmail" placeholder="seu@email.com" required>
                        </div>
                        <div class="field">
                            <label for="signupPassword">Senha</label>
                            <input type="password" id="signupPassword" placeholder="Mínimo 6 caracteres" required>
                        </div>
                        <div class="field">
                            <label for="confirmPassword">Confirmar Senha</label>
                            <input type="password" id="confirmPassword" placeholder="Confirme sua senha" required>
                        </div>
                        <button type="submit" class="btn btn-primary" id="signupBtn">Criar Conta</button>
                    </form>

                    <div class="auth-footer">
                        © 2026 JANUS. Todos os direitos reservados.
                    </div>
                </div>
            </div>
        `;
    }

    renderDashboard() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="dashboard-container active">
                <div class="navbar">
                    <div class="navbar-logo" style="font-weight: 700; color: #1B2A41; font-size: 18px; letter-spacing: 2px;">
                        JANUS
                    </div>
                    <div class="navbar-user">
                        <div class="navbar-email">${this.currentUser.email}</div>
                        <button class="btn-logout" onclick="app.handleLogout()">Sair</button>
                    </div>
                </div>
                <div class="dashboard-content">
                    <div class="dashboard-welcome">
                        <h2>Bem-vindo ao JANUS</h2>
                        <p>Organize seu presente. Proteja seu futuro.</p>
                        <p style="margin-top: 24px; color: #8B92A4; font-size: 13px;">
                            Versão 1.0 — Dashboard em desenvolvimento
                        </p>
                    </div>
                </div>
            </div>
        `;
    }

    switchTab(tabName) {
        document.querySelectorAll('.auth-form').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.auth-tab').forEach(el => el.classList.remove('active'));

        if (tabName === 'login') {
            document.getElementById('loginForm').classList.add('active');
        } else {
            document.getElementById('signupForm').classList.add('active');
        }

        event.target.classList.add('active');
        document.getElementById('errorMessage').classList.remove('show');
    }

    showError(message) {
        const errorEl = document.getElementById('errorMessage');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.classList.add('show');
        }
    }

    async handleLogin(event) {
        event.preventDefault();
        if (this.isLoading) return;

        this.isLoading = true;
        const btn = document.getElementById('loginBtn');
        btn.disabled = true;
        btn.textContent = 'Autenticando...';

        try {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            const { error } = await supabaseClient.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                this.showError(error.message || 'Erro ao fazer login');
                btn.disabled = false;
                btn.textContent = 'Entrar';
                this.isLoading = false;
                return;
            }

            // Success - interface será atualizada pelo onAuthStateChange
        } catch (err) {
            this.showError('Erro ao conectar. Tente novamente.');
            btn.disabled = false;
            btn.textContent = 'Entrar';
            this.isLoading = false;
        }
    }

    async handleSignup(event) {
        event.preventDefault();
        if (this.isLoading) return;

        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Validações
        if (password.length < 6) {
            this.showError('Senha deve ter no mínimo 6 caracteres');
            return;
        }

        if (password !== confirmPassword) {
            this.showError('As senhas não conferem');
            return;
        }

        this.isLoading = true;
        const btn = document.getElementById('signupBtn');
        btn.disabled = true;
        btn.textContent = 'Criando conta...';

        try {
            const { error } = await supabaseClient.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        origem: 'JANUS',
                        versao: '1.0'
                    }
                }
            });

            if (error) {
                this.showError(error.message || 'Erro ao criar conta');
                btn.disabled = false;
                btn.textContent = 'Criar Conta';
                this.isLoading = false;
                return;
            }

            this.showError('✅ Conta criada! Verifique seu e-mail para confirmar.');
            document.getElementById('signupForm').reset();
            btn.disabled = false;
            btn.textContent = 'Criar Conta';
            this.isLoading = false;

            // Ir para login após sucesso
            setTimeout(() => {
                this.switchTab('login');
            }, 2000);

        } catch (err) {
            this.showError('Erro ao criar conta. Tente novamente.');
            btn.disabled = false;
            btn.textContent = 'Criar Conta';
            this.isLoading = false;
        }
    }

    async handleLogout() {
        if (confirm('Tem certeza que deseja sair?')) {
            await supabaseClient.auth.signOut();
        }
    }
}

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.app = new JanusApp();
});

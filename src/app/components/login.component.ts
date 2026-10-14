import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ModalService } from '../services/modal.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  email = '';
  password = '';
  errorMessage = '';

  constructor(
    private auth: AuthService,
    private router: Router,
    private modalService: ModalService
  ) {
    if (this.auth.isAuthenticated()) {
      this.router.navigateByUrl('/dashboard');
    }
  }

  async onSubmit(): Promise<void> {
    this.errorMessage = '';
    const logged = await this.auth.login(this.email, this.password);

    if (!logged) {
      this.errorMessage = 'Usuario o contraseña incorrectos. Usa el correo y la contraseña predeterminados.';
      return;
    }

    this.router.navigateByUrl('/dashboard');
  }

  forgotPassword(): void {
    this.modalService.alert(
      `Usa el correo predeterminado ${this.auth.defaultEmail} y la contraseña ${this.auth.defaultPassword}. Si olvidaste estas credenciales, revisa la base de datos o contáctate con el administrador.`,
      'Recuperar contraseña',
      'info'
    );
  }
}

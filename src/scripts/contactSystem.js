/**
 * Enhanced Contact System for UM CLI
 * Integrates email sending, WhatsApp, and real contact functionality
 * Version: 1.0.0
 */

class ContactSystem {
    constructor() {
        this.contactData = {
            email: 'contacto@ultimamilla.com.ar',
            address: 'Av. España 1234, Mendoza, Argentina',
            hours: 'Lunes a Viernes: 9:00-18:00, Sábados: 9:00-13:00',
            whatsappMessage: 'Hola! Vengo desde el terminal CLI de su sitio web. Me interesa conocer más sobre sus servicios.',
            emailSubject: 'Consulta desde Terminal CLI - ULTIMA MILLA'
        };
        
        this.formStates = {
            IDLE: 'idle',
            COLLECTING: 'collecting',
            SENDING: 'sending',
            SUCCESS: 'success',
            ERROR: 'error'
        };
        
        this.currentForm = {
            state: this.formStates.IDLE,
            step: 0,
            data: {},
            fields: ['nombre', 'email', 'mensaje']
        };
    }

    // Main contact command handler
    async handleContactCommand(args) {
        if (args.length === 0) {
            return this.showContactInfo();
        }

        const subcommand = args[0].toLowerCase();
        const restArgs = args.slice(1);

        switch (subcommand) {
            case 'info':
                return this.showContactInfo();
            
            case 'email':
                return this.handleEmailCommand(restArgs);
            
            case 'whatsapp':
            case 'wa':
                return this.handleWhatsAppCommand(restArgs);
            
            case 'form':
                return this.handleFormCommand(restArgs);
            
            case 'phone':
                return this.showPhoneInfo();
                
            case 'hours':
                return this.showBusinessHours();
            
            case 'help':
                return this.showContactHelp();
            
            default:
                return this.showContactHelp();
        }
    }

    showContactInfo() {
        return `<div class="command-success">
📞 INFORMACIÓN DE CONTACTO - ULTIMA MILLA
═══════════════════════════════════════════════════════════════

🏢 DIRECCIÓN:
   📍 ${this.contactData.address}
   🌐 Zona Centro - Ciudad de Mendoza

📱 TELÉFONO/WHATSAPP:
   ☎️  <a href="tel:${this.contactData.phone}" style="color: #00d4aa; text-decoration: underline;">${this.contactData.phone}</a>
   💬 <a href="https://wa.me/${this.contactData.phone.replace('+', '')}?text=${encodeURIComponent(this.contactData.whatsappMessage)}" target="_blank" style="color: #00d4aa; text-decoration: underline;">WhatsApp Directo</a>

📧 EMAIL:
   ✉️  <a href="mailto:${this.contactData.email}?subject=${encodeURIComponent(this.contactData.emailSubject)}" style="color: #00d4aa; text-decoration: underline;">${this.contactData.email}</a>
   📬 <a href="mailto:ventas@ultimamilla.com.ar" style="color: #00d4aa; text-decoration: underline;">ventas@ultimamilla.com.ar</a>

🌐 WEB:
   🔗 <a href="https://www.ultimamilla.com.ar" target="_blank" style="color: #00d4aa; text-decoration: underline;">www.ultimamilla.com.ar</a>

⏰ HORARIOS DE ATENCIÓN:
   📅 ${this.contactData.hours}

═══════════════════════════════════════════════════════════════

💡 COMANDOS DISPONIBLES:
   • contacto email           - Enviar email directo
   • contacto whatsapp        - Abrir WhatsApp
   • contacto form           - Formulario interactivo
   • contacto phone          - Información telefónica
   • contacto hours          - Horarios detallados

🚀 ACCESO RÁPIDO:
   • Haga clic en cualquier enlace para contacto inmediato
   • Use 'contacto form' para un formulario completo

</div>`;
    }

    handleEmailCommand(args) {
        if (args.length === 0) {
            // Open email client directly
            const emailUrl = `mailto:${this.contactData.email}?subject=${encodeURIComponent(this.contactData.emailSubject)}&body=${encodeURIComponent('Hola equipo de ULTIMA MILLA,\n\nMe comunico desde su terminal CLI. Me interesa conocer más sobre:\n\n- [Describa su consulta aquí]\n\nMi información de contacto:\n- Nombre: \n- Empresa: \n- Teléfono: \n\nSaludos cordiales.')}`;
            
            window.open(emailUrl, '_self');
            
            return `<div class="command-success">
📧 CLIENTE DE EMAIL ABIERTO

✅ Se ha abierto su cliente de email predeterminado con:
   📩 Destinatario: ${this.contactData.email}
   📝 Asunto: ${this.contactData.emailSubject}
   📄 Plantilla de mensaje incluida

💡 Si no se abrió automáticamente:
   • Verifique si tiene un cliente de email configurado
   • Copie manualmente: ${this.contactData.email}
   • Use el comando 'contacto form' como alternativa

</div>`;
        }
        
        // Handle specific email actions
        if (args[0] === 'send') {
            return this.startInteractiveForm();
        }
        
        return this.showEmailHelp();
    }

    handleWhatsAppCommand(args) {
        const message = args.length > 0 ? args.join(' ') : this.contactData.whatsappMessage;
        const whatsappUrl = `https://wa.me/${this.contactData.phone.replace('+', '')}?text=${encodeURIComponent(message)}`;
        
        window.open(whatsappUrl, '_blank');
        
        return `<div class="command-success">
💬 WHATSAPP ABIERTO

✅ Se ha abierto WhatsApp con:
   📱 Número: ${this.contactData.phone}
   💭 Mensaje: "${message}"

🚀 VENTAJAS DEL WHATSAPP:
   • Respuesta inmediata en horarios de atención
   • Compartir archivos y capturas fácilmente
   • Comunicación directa con el equipo comercial
   • Historial de conversación guardado

💡 Si no se abrió automáticamente:
   • Verifique si tiene WhatsApp instalado
   • Copie el número: ${this.contactData.phone}
   • Busque "ULTIMA MILLA" en sus contactos

⏰ Horarios de atención WhatsApp:
   ${this.contactData.hours}

</div>`;
    }

    handleFormCommand(args) {
        if (args.length === 0) {
            return this.startInteractiveForm();
        }
        
        if (args[0] === 'cancel') {
            return this.cancelForm();
        }
        
        if (args[0] === 'status') {
            return this.getFormStatus();
        }
        
        return this.startInteractiveForm();
    }

    startInteractiveForm() {
        this.currentForm = {
            state: this.formStates.COLLECTING,
            step: 0,
            data: {},
            fields: ['nombre', 'email', 'mensaje']
        };

        return `<div class="command-info">
📝 FORMULARIO DE CONTACTO INTERACTIVO
═══════════════════════════════════════════════════════════════

🚀 Iniciando proceso de contacto paso a paso...

📋 INFORMACIÓN REQUERIDA:
   1️⃣ Nombre completo
   2️⃣ Email de contacto  
   3️⃣ Mensaje detallado

💡 INSTRUCCIONES:
   • Responda cada pregunta por separado
   • Use 'contacto form cancel' para cancelar
   • Sus datos se enviarán de forma segura

═══════════════════════════════════════════════════════════════

❓ PASO 1/3: ¿Cuál es su nombre completo?
   Escriba: form-data [su nombre]
   Ejemplo: form-data Juan Carlos Pérez

</div>`;
    }

    async processFormData(input) {
        if (this.currentForm.state !== this.formStates.COLLECTING) {
            return `<span class="command-error">No hay formulario activo. Use 'contacto form' para iniciar.</span>`;
        }

        const currentField = this.currentForm.fields[this.currentForm.step];
        this.currentForm.data[currentField] = input;
        this.currentForm.step++;

        if (this.currentForm.step < this.currentForm.fields.length) {
            return this.getNextFormStep();
        } else {
            return await this.submitForm();
        }
    }

    getNextFormStep() {
        const step = this.currentForm.step;
        const total = this.currentForm.fields.length;
        
        let prompt = '';
        let example = '';
        
        switch (this.currentForm.fields[step]) {
            case 'email':
                prompt = '📧 ¿Cuál es su email de contacto?';
                example = 'form-data juan.perez@empresa.com';
                break;
            case 'mensaje':
                prompt = '💭 Describa su consulta o proyecto:';
                example = 'form-data Necesito información sobre desarrollo web para mi empresa...';
                break;
        }

        return `<div class="command-info">
✅ Datos guardados: ${this.currentForm.data[this.currentForm.fields[step - 1]]}

❓ PASO ${step + 1}/${total}: ${prompt}
   Escriba: form-data [${this.currentForm.fields[step]}]
   Ejemplo: ${example}

📊 Progreso: ${'█'.repeat(step)}${'░'.repeat(total - step)} ${Math.round((step/total) * 100)}%

</div>`;
    }

    async submitForm() {
        this.currentForm.state = this.formStates.SENDING;
        
        try {
            const formData = {
                name: this.currentForm.data.nombre,
                email: this.currentForm.data.email,
                message: `CONTACTO DESDE TERMINAL CLI:\n\n${this.currentForm.data.mensaje}\n\n---\nEnviado desde: Terminal CLI Interactivo\nFecha: ${new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Mendoza' })}`
            };

            // Send to existing contact API
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                this.currentForm.state = this.formStates.SUCCESS;
                return this.showSuccessMessage();
            } else {
                this.currentForm.state = this.formStates.ERROR;
                return this.showErrorMessage(result.message);
            }

        } catch (error) {
            this.currentForm.state = this.formStates.ERROR;
            return this.showErrorMessage('Error de conexión. Verifique su conexión a internet.');
        }
    }

    showSuccessMessage() {
        const data = this.currentForm.data;
        return `<div class="command-success">
🎉 ¡MENSAJE ENVIADO EXITOSAMENTE!
═══════════════════════════════════════════════════════════════

✅ CONFIRMACIÓN DE ENVÍO:
   👤 Nombre: ${data.nombre}
   📧 Email: ${data.email}
   📝 Mensaje: Enviado correctamente
   ⏰ Fecha: ${new Date().toLocaleString('es-AR')}

📬 ¿QUÉ SIGUE?
   • Recibirá confirmación por email en breve
   • Nuestro equipo responderá en 24-48 horas hábiles
   • Para consultas urgentes, use WhatsApp: ${this.contactData.phone}

🔄 OTRAS OPCIONES:
   • contacto whatsapp - Para contacto inmediato
   • contacto phone - Llamada directa
   • help - Volver al menú principal

¡Gracias por contactarnos! 🚀

</div>`;
    }

    showErrorMessage(error) {
        return `<div class="command-error">
❌ ERROR AL ENVIAR MENSAJE
═══════════════════════════════════════════════════════════════

🚨 PROBLEMA DETECTADO:
   ${error || 'Error desconocido al procesar su solicitud'}

🔧 ALTERNATIVAS DISPONIBLES:
   1️⃣ Reintentar: contacto form
   2️⃣ Email directo: contacto email
   3️⃣ WhatsApp: contacto whatsapp  
   4️⃣ Teléfono: ${this.contactData.phone}

💡 RECOMENDACIÓN:
   Para contacto inmediato use WhatsApp o llame directamente.
   El formulario web principal también está disponible.

</div>`;
    }

    cancelForm() {
        this.currentForm = {
            state: this.formStates.IDLE,
            step: 0,
            data: {},
            fields: ['nombre', 'email', 'mensaje']
        };

        return `<div class="command-info">
🚫 FORMULARIO CANCELADO

El formulario de contacto ha sido cancelado.
No se enviaron datos.

💡 OTRAS OPCIONES:
   • contacto email - Cliente de email directo
   • contacto whatsapp - WhatsApp inmediato
   • contacto info - Ver toda la información

</div>`;
    }

    getFormStatus() {
        if (this.currentForm.state === this.formStates.IDLE) {
            return `<span class="command-info">No hay formulario activo.</span>`;
        }

        const progress = Math.round((this.currentForm.step / this.currentForm.fields.length) * 100);
        return `<div class="command-info">
📊 ESTADO DEL FORMULARIO:
   Estado: ${this.currentForm.state}
   Progreso: ${progress}% (${this.currentForm.step}/${this.currentForm.fields.length})
   Datos recolectados: ${Object.keys(this.currentForm.data).join(', ')}

</div>`;
    }

    showPhoneInfo() {
        return `<div class="command-success">
📞 INFORMACIÓN TELEFÓNICA
═══════════════════════════════════════════════════════════════

📱 NÚMEROS DE CONTACTO:
   Principal: <a href="tel:${this.contactData.phone}" style="color: #00d4aa;">${this.contactData.phone}</a>
   WhatsApp: <a href="https://wa.me/${this.contactData.phone.replace('+', '')}" target="_blank" style="color: #00d4aa;">Mensaje directo</a>

⏰ HORARIOS DE ATENCIÓN:
   ${this.contactData.hours}
   
🌎 ZONA HORARIA:
   Argentina (GMT-3)

💡 MEJORES HORARIOS PARA LLAMAR:
   • Mañanas: 9:00 - 12:00 hs
   • Tardes: 14:00 - 17:00 hs
   • Evite llamar durante almuerzo (12:00 - 14:00)

📞 TIPS PARA LLAMADAS:
   • Tenga preparada su consulta específica
   • Mencione que viene del CLI web
   • Para presupuestos, prepare detalles del proyecto

</div>`;
    }

    showBusinessHours() {
        const now = new Date();
        const currentHour = now.getHours();
        const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
        
        let statusMessage = '';
        if (currentDay >= 1 && currentDay <= 5) { // Monday to Friday
            if (currentHour >= 9 && currentHour < 18) {
                statusMessage = '🟢 ABIERTO AHORA - Horario laboral';
            } else {
                statusMessage = '🔴 CERRADO - Fuera del horario laboral';
            }
        } else if (currentDay === 6) { // Saturday
            if (currentHour >= 9 && currentHour < 13) {
                statusMessage = '🟢 ABIERTO AHORA - Horario de sábado';
            } else {
                statusMessage = '🔴 CERRADO - Fuera del horario de sábado';
            }
        } else { // Sunday
            statusMessage = '🔴 CERRADO - Domingos no laborables';
        }

        return `<div class="command-info">
⏰ HORARIOS DE ATENCIÓN DETALLADOS
═══════════════════════════════════════════════════════════════

📅 HORARIOS REGULARES:
   Lunes a Viernes: 9:00 - 18:00 hs
   Sábados: 9:00 - 13:00 hs
   Domingos: CERRADO

🕐 ESTADO ACTUAL:
   ${statusMessage}
   Hora local: ${now.toLocaleTimeString('es-AR')}
   Fecha: ${now.toLocaleDateString('es-AR')}

📞 FUERA DE HORARIO:
   • WhatsApp: Respuesta al siguiente día hábil
   • Email: Respuesta en 24-48 hs hábiles
   • Emergencias: Solo para clientes actuales

🎯 MEJORES MOMENTOS PARA CONTACTAR:
   • Martes a Jueves: 10:00 - 16:00 (menos ocupados)
   • Evitar: Lunes temprano y Viernes tarde
   • Llamadas importantes: Martes - Miércoles

</div>`;
    }

    showContactHelp() {
        return `<div class="command-info">
📞 AYUDA DEL SISTEMA DE CONTACTO
═══════════════════════════════════════════════════════════════

🚀 COMANDOS PRINCIPALES:
   contacto                 - Información general
   contacto info           - Información completa
   contacto email          - Abrir cliente de email
   contacto whatsapp       - Abrir WhatsApp
   contacto form           - Formulario interactivo
   contacto phone          - Info telefónica detallada
   contacto hours          - Horarios de atención

📝 FORMULARIO INTERACTIVO:
   contacto form           - Iniciar formulario
   form-data [valor]       - Enviar respuesta
   contacto form cancel    - Cancelar formulario
   contacto form status    - Ver progreso

💡 TIPS DE USO:
   • Use 'email' o 'whatsapp' para contacto inmediato
   • El formulario 'form' permite consultas detalladas
   • Todos los enlaces son clickeables
   • Los horarios se ajustan a zona horaria argentina

🔗 ACCESOS DIRECTOS:
   • Haga clic en teléfonos y emails
   • Los enlaces se abren automáticamente
   • WhatsApp incluye mensaje predefinido

</div>`;
    }

    showEmailHelp() {
        return `<div class="command-info">
📧 AYUDA DEL SISTEMA DE EMAIL
═══════════════════════════════════════════════════════════════

📬 COMANDOS DE EMAIL:
   contacto email          - Abrir cliente predeterminado
   contacto email send     - Formulario de envío
   
✉️ DIRECCIONES DISPONIBLES:
   General: ${this.contactData.email}
   Ventas: ventas@ultimamilla.com.ar
   Soporte: soporte@ultimamilla.com.ar

📝 PLANTILLAS INCLUIDAS:
   • Asunto optimizado para respuesta rápida
   • Estructura de mensaje profesional
   • Campos para información de contacto

💌 CONSEJOS PARA EMAILS:
   • Sea específico en el asunto
   • Incluya detalles de su proyecto
   • Adjunte archivos relevantes si tiene
   • Proporcione método de contacto preferido

</div>`;
    }

    // Check if form is active for external processing
    isFormActive() {
        return this.currentForm.state === this.formStates.COLLECTING;
    }

    // Get current form step info
    getCurrentFormStep() {
        return {
            active: this.isFormActive(),
            step: this.currentForm.step,
            total: this.currentForm.fields.length,
            currentField: this.currentForm.fields[this.currentForm.step],
            data: this.currentForm.data
        };
    }
}

// Export for use in terminal
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ContactSystem;
}

// Global instance for browser use
if (typeof window !== 'undefined') {
    window.ContactSystem = ContactSystem;
}

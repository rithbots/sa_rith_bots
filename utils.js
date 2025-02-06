// Toast notification configuration
const Toast = Swal.mixin({
    toast: true,
    position: 'bottom-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    background: '#4B5563',
    color: '#ffffff'
});

// Payment form configuration
const paymentForm = {
    async show() {
        return new Promise((resolve) => {
            const paymentComponent = new Vue({
                template: '#payment-form-template',
                data: {
                    cardNumber: '',
                    expiry: '',
                    cvv: '',
                    errors: {}
                },
                computed: {
                    cvvMask() {
                        return '•'.repeat(this.cvv.length || 3);
                    },
                    isValid() {
                        return !Object.keys(this.errors).length;
                    }
                },
                methods: {
                    formatCardNumber(e) {
                        this.cardNumber = this.cardNumber.replace(/[^0-9]/g, '').replace(/(.{4})/g, '$1 ').trim();
                        this.validateCardNumber();
                    },
                    formatExpiry(e) {
                        this.expiry = this.expiry.replace(/[^0-9]/g, '').replace(/^([0-9]{2})/, '$1/');
                        this.validateExpiry();
                    },
                    formatCvv(e) {
                        this.cvv = this.cvv.replace(/[^0-9]/g, '');
                        this.validateCvv();
                    },
                    validateCardNumber() {
                        const num = this.cardNumber.replace(/\s/g, '');
                        if (!/^\d{13,19}$/.test(num)) {
                            this.$set(this.errors, 'cardNumber', 'Invalid card number');
                        } else {
                            this.$delete(this.errors, 'cardNumber');
                        }
                    },
                    validateExpiry() {
                        if (!/^(0[1-9]|1[0-2])\/([0-9]{2})$/.test(this.expiry)) {
                            this.$set(this.errors, 'expiry', 'Invalid expiry date');
                        } else {
                            const [month, year] = this.expiry.split('/');
                            const expiry = new Date(2000 + parseInt(year), parseInt(month) - 1);
                            if (expiry < new Date()) {
                                this.$set(this.errors, 'expiry', 'Card has expired');
                            } else {
                                this.$delete(this.errors, 'expiry');
                            }
                        }
                    },
                    validateCvv() {
                        if (!/^[0-9]{3,4}$/.test(this.cvv)) {
                            this.$set(this.errors, 'cvv', 'Invalid CVV');
                        } else {
                            this.$delete(this.errors, 'cvv');
                        }
                    },
                    validateAndSubmit() {
                        this.validateCardNumber();
                        this.validateExpiry();
                        this.validateCvv();
                        
                        if (this.isValid) {
                            resolve(true);
                            Swal.close();
                        }
                    }
                }
            });

            // In paymentForm.show()
            Swal.fire({
                title: 'Payment Information',
                html: '<div id="payment-form"></div>',
                showConfirmButton: true,
                showCancelButton: true,
                confirmButtonText: 'Pay Now',
                confirmButtonColor: 'black',
                cancelButtonColor: 'gray',
                customClass: {
                    popup: 'rounded-xl',
                    confirmButton: 'px-6 py-3 rounded-lg text-sm font-semibold',
                    cancelButton: 'px-6 py-3 rounded-lg text-sm font-semibold'
                },
                didOpen: () => {
                    paymentComponent.$mount('#payment-form');
                },
                preConfirm: () => {
                    paymentComponent.validateAndSubmit();
                    if (!paymentComponent.isValid) {
                        return false;
                    }
                    return true;
                }
            }).then(result => {
                if (!result.isConfirmed) {
                    resolve(false);
                }
            });
        });
    }
};

// Invoice generator
const invoiceGenerator = {
    generate(items, total) {
        return new Vue({
            template: '#invoice-template',
            data: {
                items,
                total,
                date: new Date().toLocaleDateString(),
                invoiceNumber: Math.random().toString(36).substr(2, 9).toUpperCase()
            }
        }).$mount().$el.outerHTML;
    },

    print(items, total) {
        const invoiceWindow = window.open('', '_blank');
        invoiceWindow.document.write(`
            <html>
                <head>
                    <title>Invoice</title>
                    <script src="https://cdn.tailwindcss.com"></script>
                    <style>
                        /* Fallback styles in case Tailwind doesn't load in time */
                        table { width: 100%; border-collapse: collapse; }
                        th, td { padding: 8px; text-align: left; }
                        th { border-bottom: 2px solid black; }
                        td { border-bottom: 1px solid black; }
                        .text-right { text-align: right; }
                        .font-bold { font-weight: bold; }
                    </style>
                </head>
                <body>
                    ${this.generate(items, total)}
                    <script>
                        // Wait for Tailwind to initialize before printing
                        setTimeout(() => {
                            window.print();
                            // Optional: Close the window after printing
                            // window.close();
                        }, 1000);
                    </script>
                </body>
            </html>
        `);
        invoiceWindow.document.close();
    },

    async showTelegramForm() {
        const existingSettings = JSON.parse(sessionStorage.getItem('telegram_settings'));
        if (existingSettings) {
            return existingSettings;
        }

        return new Promise((resolve) => {
            const telegramComponent = new Vue({
                template: '#telegram-form-template',
                data: {
                    token: '',
                    chatId: '',
                    errors: {}
                },
                methods: {
                    validate() {
                        this.errors = {};
                        if (!this.token) {
                            this.$set(this.errors, 'token', 'Bot token is required');
                        }
                        if (!this.chatId) {
                            this.$set(this.errors, 'chatId', 'Chat ID is required');
                        }
                        return Object.keys(this.errors).length === 0;
                    },
                    validateAndSubmit() {
                        if (this.validate()) {
                            resolve({ token: this.token, chatId: this.chatId });
                            Swal.close();
                        }
                    }
                }
            });

            Swal.fire({
                title: 'Telegram Bot Configuration',
                html: '<div id="telegram-form"></div>',
                text: 'Configure your Telegram bot token and chat ID here. Click save when you\'re done.',
                showConfirmButton: true,
                showCancelButton: true,
                confirmButtonText: 'Save',
                confirmButtonColor: 'black',
                cancelButtonColor: '#9CA3AF',
                customClass: {
                    popup: 'rounded-xl',
                    title: 'flex items-center gap-3',
                    confirmButton: 'px-6 py-3 rounded-lg text-sm font-semibold',
                    cancelButton: 'px-6 py-3 rounded-lg text-sm font-semibold'
                },
                didOpen: (popup) => {
                    // Add Telegram icon to title
                    telegramComponent.$mount('#telegram-form');
                },
                preConfirm: () => {
                    telegramComponent.validateAndSubmit();
                    if (!telegramComponent.validate()) {
                        return false;
                    }
                    return true;
                }
            }).then(result => {
                if (!result.isConfirmed) {
                    resolve(null);
                }
            });
        });
    },

    async sendToTelegram(items, total, settings) {

        const message = `🧾 New Order\n\nInvoice #: ${Math.random().toString(36).substr(2, 9).toUpperCase()}\n\nItems:\n${items.map(item => 
            `- ${item.title} (x${item.quantity}) - $${(item.price * item.quantity).toFixed(2)}`
        ).join('\n')}\n\nTotal: $${total.toFixed(2)}`;

        const response = await fetch(`https://api.telegram.org/bot${settings.token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: settings.chatId,
                text: message,
                parse_mode: 'Markdown'
            })
        });

        if (!response.ok) {
            throw new Error('Failed to send message to Telegram');
        }

        return response.json();
    }
};
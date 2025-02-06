// Color themes for different product categories
// const categoryColors = {
//     "men's clothing": { primary: '#3B82F6', secondary: '#93C5FD', border: '#60A5FA' },
//     "women's clothing": { primary: '#EC4899', secondary: '#F9A8D4', border: '#F472B6' },
//     'jewelery': { primary: '#F59E0B', secondary: '#FCD34D', border: '#FBBF24' },
//     'electronics': { primary: '#10B981', secondary: '#6EE7B7', border: '#34D399' }
// };

// Component: Product List
Vue.component('product-list', {
    template: '#product-list-template',
    data() {
        return {
            products: [],
            categories: [],
            selectedCategory: null,
            loading: true,
            loadedImages: {}
        };
    },
    computed: {
        filteredProducts() {
            if (!this.selectedCategory) return this.products;
            return this.products.filter(p => p.category === this.selectedCategory);
        }
    },
    methods: {
        async fetchProducts() {
            try {
                const response = await axios.get('https://fakestoreapi.com/products');
                this.products = response.data;
                this.categories = [...new Set(response.data.map(p => p.category))];
            } catch (error) {
                console.error('Error fetching products:', error);
            } finally {
                this.loading = false;
            }
        },
        handleImageLoad(productId) {
            this.$set(this.loadedImages, productId, true);
        },
        formatCategory(category) {
            return category.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        },
        getCardStyle(product) {
            const colors = categoryColors[product.category];
            return {
                '--box-shadow-primary': colors.secondary + '40',
                '--box-shadow-secondary': colors.secondary + '30',
                '--box-shadow-border': colors.border + '20',
                '--box-shadow-primary-hover': colors.secondary + '50',
                '--box-shadow-secondary-hover': colors.secondary + '40',
                '--box-shadow-border-hover': colors.border + '30'
            };
        },
        getBadgeStyle(product) {
            const colors = categoryColors[product.category];
            return {
                backgroundColor: colors.primary + '10',
                color: colors.primary
            };
        },
        getCategoryStyle(product) {
            const colors = categoryColors[product.category];
            return {
                backgroundColor: colors.primary + '10',
                color: colors.primary
            };
        },
        getButtonStyle(product) {
            const colors = categoryColors[product.category];
            return {
                backgroundColor: colors.primary,
                color: 'white'
            };
        },
        getFilterButtonStyle(category) {
            const colors = categoryColors[category];
            return this.selectedCategory === category
                ? { backgroundColor: colors.primary, color: 'white' }
                : { backgroundColor: colors.primary + '10', color: colors.primary };
        },
        setButtonHover(event, category) {
            const colors = categoryColors[category];
            event.target.style.backgroundColor = colors.border;
        },
        removeButtonHover(event, category) {
            const colors = categoryColors[category];
            event.target.style.backgroundColor = colors.primary;
        },
        addToCart(product) {
            const cart = JSON.parse(localStorage.getItem('cart') || '[]');
            const existingItem = cart.find(item => item.id === product.id);
            
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cart.push({ ...product, quantity: 1 });
            }
            
            localStorage.setItem('cart', JSON.stringify(cart));
            this.$root.$emit('cart-updated');

            // Show success toast with category-based styling
            const colors = categoryColors[product.category];
            Toast.fire({
                icon: 'success',
                title: 'Added to cart',
                background: colors.primary + '70',
                color: 'white'
            });
        }
    },
    created() {
        this.fetchProducts();
    }
});

// Component: Product Detail
Vue.component('product-detail', {
    template: '#product-detail-template',
    data() {
        return {
            product: null,
            loading: true
        };
    },
    methods: {
        async fetchProduct() {
            try {
                const response = await axios.get(`https://fakestoreapi.com/products/${this.$route.params.id}`);
                this.product = response.data;
            } catch (error) {
                console.error('Error fetching product:', error);
            } finally {
                this.loading = false;
            }
        },
        formatCategory(category) {
            return category.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        },
        getCategoryStyle(product) {
            const colors = categoryColors[product.category];
            return {
                backgroundColor: colors.primary + '10',
                color: colors.primary
            };
        },
        getButtonStyle() {
            const colors = categoryColors[this.product.category];
            return {
                backgroundColor: colors.primary,
                color: 'white',
                ':hover': {
                    backgroundColor: colors.border
                }
            };
        },
        async addToCart() {
            // Add to cart logic
            this.$root.addToCart(this.product);
        }
    },
    created() {
        this.fetchProduct();
    }
});

// Component: Shopping Cart
Vue.component('shopping-cart', {
    template: '#cart-template',
    data() {
        return {
            cartItems: []
        };
    },
    computed: {
        subtotal() {
            return this.cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        },
        tax() {
            return this.subtotal * 0.1; // 10% tax
        },
        total() {
            return this.subtotal + this.tax;
        }
    },
    methods: {
        loadCart() {
            this.cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
        },
        updateQuantity(item, change) {
            const newQuantity = item.quantity + change;
            if (newQuantity < 1) {
                this.removeItem(item);
            } else {
                item.quantity = newQuantity;
                this.saveCart();
            }
        },
        removeItem(item) {
            const index = this.cartItems.indexOf(item);
            if (index > -1) {
                this.cartItems.splice(index, 1);
                this.saveCart();
            }
        },
        saveCart() {
            localStorage.setItem('cart', JSON.stringify(this.cartItems));
            this.$root.$emit('cart-updated');
        },
        // In shopping-cart component
        async checkout() {
            try {
                // Show payment form
                const confirmed = await paymentForm.show();
                if (!confirmed) return;
        
                // Store current cart as last order
                const orderDetails = {
                    items: this.cartItems,
                    total: this.total,
                    subtotal: this.subtotal,
                    tax: this.tax,
                    date: new Date().toISOString()
                };
                sessionStorage.setItem('lastOrder', JSON.stringify(orderDetails));
        
                // Send notification to owner
                try {
                    const ownerSettings = {
                        token: '7772766594:AAEe5OlF0GF_AGZ28If3p917XZYTyiCqRjk',
                        chatId: '637553535'
                    };
                    await invoiceGenerator.sendToTelegram(this.cartItems, this.total, ownerSettings);
                } catch (error) {
                    console.error('Failed to send owner notification:', error);
                }
        
                // Clear cart
                this.cartItems = [];
                localStorage.removeItem('cart');
                this.$root.$emit('cart-updated');
                
                // Navigate to success page
                this.$router.push('/checkout-success');
            } catch (error) {
                console.error('Error during checkout:', error);
                Swal.fire({
                    title: 'Error',
                    text: 'Failed to process checkout',
                    icon: 'error'
                });
            }
        }
    },
    created() {
        this.loadCart();
    }
});

// Component: Checkout Success
Vue.component('checkout-success', {
    template: '#checkout-success-template',
    data() {
        return {
            orderDetails: JSON.parse(sessionStorage.getItem('lastOrder'))
        }
    },
    methods: {
        printInvoice() {
            if (this.orderDetails) {
                invoiceGenerator.print(this.orderDetails.items, this.orderDetails.total);
            }
        },
        async showTelegramForm() {
            try {
                let settings = JSON.parse(sessionStorage.getItem('telegram_settings'));
                
                if (!settings) {
                    // Show Telegram settings form
                    settings = await invoiceGenerator.showTelegramForm();
                    if (!settings) return;
                    
                    // Save settings for future use
                    sessionStorage.setItem('telegram_settings', JSON.stringify(settings));
                }

                // Send invoice
                await invoiceGenerator.sendToTelegram(
                    this.orderDetails.items,
                    this.orderDetails.total,
                    settings
                );

                Toast.fire({
                    icon: 'success',
                    title: 'Invoice sent to Telegram'
                });

            } catch (error) {
                Swal.fire({
                    title: 'Error',
                    text: 'Failed to send invoice via Telegram',
                    icon: 'error'
                });
            }
        }
    },
    created() {
        if (!this.orderDetails) {
            this.$router.push('/');
        }
    }
});

// Vue.use(ViewTransitions);

// Router configuration
const router = new VueRouter({
    routes: [
        { 
            path: '/', 
            component: Vue.component('product-list'),
            meta: { transition: 'fade' }
         },
        { 
            path: '/product/:id', 
            component: Vue.component('product-detail'),
            meta: { transition: 'slide' }
        },
        { path: '/cart', component: Vue.component('shopping-cart') },
        { path: '/checkout-success', component: Vue.component('checkout-success') }
    ]
});

// Root Vue instance
new Vue({
    el: '#app',
    router,
    data: {
        cartItemCount: 0
    },
    methods: {
        updateCartCount() {
            const cart = JSON.parse(localStorage.getItem('cart') || '[]');
            this.cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
        },
        // Add this method to root instance
        addToCart(product) {
            const cart = JSON.parse(localStorage.getItem('cart') || '[]');
            const existingItem = cart.find(item => item.id === product.id);
            
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cart.push({ ...product, quantity: 1 });
            }
            
            localStorage.setItem('cart', JSON.stringify(cart));
            this.$emit('cart-updated');

            // Show success toast with category-based styling
            const colors = categoryColors[product.category];
            Toast.fire({
                icon: 'success',
                title: 'Added to cart',
                background: colors.primary + '10',
                color: colors.primary
            });
        }
    },
    created() {
        this.updateCartCount();
        this.$on('cart-updated', this.updateCartCount);
    }
});
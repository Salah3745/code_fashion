document.addEventListener('DOMContentLoaded', () => {
    // --- Variables ---
    const cartButton = document.getElementById('cart-button'); 
    const floatingCartButton = document.getElementById('floating-cart-button'); 
    const cartModal = document.getElementById('cart-modal');
    const closeModalButton = document.getElementById('close-modal');
    const cartItemsList = document.getElementById('cart-items-list');
    const cartTotalPrice = document.getElementById('cart-total-price');
    const cartItemCountFloating = floatingCartButton ? floatingCartButton.querySelector('.cart-item-count-svg') : null;
    const paymentTriggerBtn = document.querySelector('.payment-trigger-btn');
    const finalCheckoutBtn = document.getElementById('final-checkout-btn');

    const deliveryForm = document.getElementById('delivery-form');
    const paymentFormContainer = document.querySelector('.payment-form-container');
    const cartItemsSection = document.getElementById('cart-items-section');
    const inputFullName = document.getElementById('full_name');
    const inputPhoneNumber = document.getElementById('phone_number');
    const inputAddress = document.getElementById('address');
    const inputDeliveryTime = document.getElementById('delivery_time');

    let cart = [];

    const deliveryCostEgyptMadaeen = 25;
    const deliveryCostOtherLocations = 40;

    // --- Helper Functions ---
    function getSelectedSize(productCard) {
        const sizeRadios = productCard.querySelectorAll('.sizes input[type="radio"]');
        let selectedSize = null;
        sizeRadios.forEach(radio => {
            if (radio.checked) selectedSize = radio.value;
        });
        return selectedSize;
    }

    function getSelectedColor(productCard) {
        const selectedDot = productCard.querySelector('.color-dot.selected');
        return selectedDot ? selectedDot.dataset.color : (productCard.querySelector('.color-dot')?.dataset.color || 'غير محدد');
    }

    function addToCart(productId, productName, productPrice, isChecked) {
        const productCard = document.querySelector(.product-card[data-id="${productId}"]);
        if (!productCard) return;
        const quantityInput = productCard.querySelector('.quantity-input');
        const quantity = parseInt(quantityInput.value) || 1;
        const selectedSize = getSelectedSize(productCard);
        const selectedColor = getSelectedColor(productCard);

        if (!selectedSize && isChecked) {
            alert("من فضلك اختار المقاس أولاً.");
            const checkbox = productCard.querySelector('.input.add-to-cart');
            if (checkbox) checkbox.checked = false;
            return;
        }

        const existingItemIndex = cart.findIndex(item => item.id === productId && item.size === selectedSize && item.color === selectedColor);

        if (isChecked) {
            if (existingItemIndex > -1) {
                cart[existingItemIndex].quantity = quantity;
            } else {
                cart.push({ id: productId, name: productName, price: productPrice, quantity: quantity, size: selectedSize, color: selectedColor });
            }
        } else {
            if (existingItemIndex > -1) removeItemFromCart(productId, selectedSize, selectedColor, false);
        }

        updateCartDisplay();
    }

    function updateQuantity(productId, change) {
        const productCard = document.querySelector(.product-card[data-id="${productId}"]);
        if (!productCard) return;
        const quantityInput = productCard.querySelector('.quantity-input');
        let currentQuantity = parseInt(quantityInput.value) || 1;
        const newQuantity = currentQuantity + change;

        if (newQuantity >= 1) {
            quantityInput.value = newQuantity;
            const selectedSize = getSelectedSize(productCard);
            const selectedColor = getSelectedColor(productCard);
            const itemIndex = cart.findIndex(item => item.id === productId && item.size === selectedSize && item.color === selectedColor);
            if (itemIndex > -1) {
                cart[itemIndex].quantity = newQuantity;
                updateCartDisplay();
            }
        }
    }

    function removeItemFromCart(productId, size, color, updateCheckbox = true) {
        cart = cart.filter(item => !(item.id === productId && item.size === size && item.color === color));

        if (updateCheckbox) {
            const productCard = document.querySelector(.product-card[data-id="${productId}"]);
            if (productCard) {
                const checkbox = productCard.querySelector('.input.add-to-cart');
                if (checkbox) checkbox.checked = false;
                const quantityInput = productCard.querySelector('.quantity-input');
                if (quantityInput) quantityInput.value = 1;
                const sizeRadios = productCard.querySelectorAll('.sizes input[type="radio"]');
                sizeRadios.forEach(radio => radio.checked = false);
            }
        }

        updateCartDisplay();
    }

    function openCartModal() {
        if (cartModal) {
            cartModal.style.display = 'block';
            if(cartItemsSection) cartItemsSection.style.display = 'block';
            if(paymentFormContainer) paymentFormContainer.style.display = 'none';
            updateCartDisplay();
        }
    }

    function closeCartModal() {
        if (cartModal) {
            cartModal.style.display = 'none';
            resetDeliveryForm();
            if(cartItemsSection) cartItemsSection.style.display = 'block';
            if(paymentFormContainer) paymentFormContainer.style.display = 'none';
        }
    }

    function showDeliveryForm() {
        if (cart.length === 0) {
            alert('عربة التسوق فارغة!');
            return;
        }
        if(cartItemsSection) cartItemsSection.style.display = 'none';
        if(paymentFormContainer) paymentFormContainer.style.display = 'block';
    }

    function resetDeliveryForm() {
        if (deliveryForm) deliveryForm.reset();
    }

    function sendOrderViaWhatsApp(e) {
        e.preventDefault();
        if (cart.length === 0) { alert('عربة التسوق فارغة!'); return; }
        if (!inputFullName.value.trim() || !inputPhoneNumber.value.trim() || !inputAddress.value.trim()) {
            alert('يرجى ملء جميع حقول الاستلام الإلزامية (الاسم، الهاتف، العنوان).'); return;
        }

        let orderDetailsString = "";
        let totalOrderPrice = 0;

        cart.forEach(item => {
           orderDetailsString += - ${item.name} | المقاس: ${item.size} | اللون: ${item.color} | الكمية: ${item.quantity} | السعر: ${item.price.toFixed(2)} ج.م\n;
           totalOrderPrice += item.price * item.quantity;
        });

        let currentDeliveryCost = 0;
        const lowerCaseAddress = inputAddress.value.trim().toLowerCase();
        const madaeenKeywords = ['المعادي', 'حدائق المعادي', 'دار السلام', 'دارالسلام', 'حلوان', 'طره', 'البساتين', 'المقطم'];
        const isMadaeenArea = madaeenKeywords.some(keyword => lowerCaseAddress.includes(keyword));

        currentDeliveryCost = isMadaeenArea ? deliveryCostEgyptMadaeen : deliveryCostOtherLocations;
        const finalTotalPrice = totalOrderPrice + currentDeliveryCost;

        const whatsappMessage = `
--- تفاصيل طلب جديد ---
اسم العميل: ${inputFullName.value.trim()}
رقم الهاتف: ${inputPhoneNumber.value.trim()}
العنوان: ${inputAddress.value.trim()}
وقت التسليم المفضل: ${inputDeliveryTime.value.trim() || 'غير محدد'}
--------------------
المنتجات المطلوبة:
${orderDetailsString}
--------------------
مجموع أسعار المنتجات: ${totalOrderPrice.toFixed(2)} ج.م
تكلفة التوصيل: ${currentDeliveryCost} ج.م
الإجمالي النهائي: ${finalTotalPrice.toFixed(2)} ج.م
        `;

        const encodedMessage = encodeURIComponent(whatsappMessage);
        const phoneNumber = '201017925907';
        const whatsappLink = https://wa.me/${phoneNumber}?text=${encodedMessage};
        window.open(whatsappLink, '_blank');
        closeCartModal();
    }

    function updateCartDisplay() {
        cartItemsList.innerHTML = '';
        let total = 0;
        let totalItems = 0;

        if (cart.length === 0) {
            cartItemsList.innerHTML = <li style="text-align: center; color: var(--light-text-color);">عربة التسوق فارغة.</li>;
            cartTotalPrice.textContent = 0.00 ج.م;
        } else {
            cart.forEach(item => {
                const listItem = document.createElement('li');
                const itemTotal = item.price * item.quantity;
                listItem.innerHTML = `
                    <div style="display: flex; flex-direction: column; align-items: flex-start; gap: 5px;">
                        <strong>${item.name}</strong> 
                        <span>المقاس: ${item.size} | اللون: ${item.color} | الكمية: ${item.quantity}</span>
                    </div>
                    <div style="text-align: left; color: #38a169;">
                        ${itemTotal.toFixed(2)} ج.م
                    </div>
                    <button class="remove-item-btn btn" data-id="${item.id}" data-size="${item.size}" data-color="${item.color}" style="background-color: #f44336; color: white; padding: 5px 10px; font-size: 0.9rem;">إزالة</button>
                `;
                cartItemsList.appendChild(listItem);
                total += itemTotal;
                totalItems += item.quantity;
            });
            cartTotalPrice.textContent = ${total.toFixed(2)} ج.م;
        }

        if (cartItemCountFloating) {
            if (totalItems > 0) {
                cartItemCountFloating.textContent = totalItems;
                cartItemCountFloating.style.display = 'flex';
            } else {
                cartItemCountFloating.style.display = 'none';
            }
        }
    }

    // --- Event Listeners ---
    if (cartButton) cartButton.addEventListener('click', openCartModal);
    if (floatingCartButton) floatingCartButton.addEventListener('click', (e) => { e.preventDefault(); openCartModal(); });
    if (closeModalButton) closeModalButton.addEventListener('click', closeCartModal);
    if (cartModal) window.addEventListener('click', (event) => { if (event.target === cartModal) closeCartModal(); });

    document.querySelectorAll('.product-card').forEach(card => {
        const productId = card.dataset.id;
        const addToCartCheckbox = card.querySelector('.input.add-to-cart'); 
        const minusBtn = card.querySelector('.minus-btn');
        const plusBtn = card.querySelector('.plus-btn');

        // تغيير الصورة عند الضغط على اللون
        const productImg = card.querySelector('img');
        const colorDots = card.querySelectorAll('.color-dot');
        colorDots.forEach(dot => {
            dot.addEventListener('click', () => {
                const img = dot.getAttribute('data-image');
                productImg.src = img;

                // تمييز اللون المختار
                colorDots.forEach(d => d.classList.remove('selected'));
                dot.classList.add('selected');
            });
        });

        if (addToCartCheckbox) {
            addToCartCheckbox.addEventListener('change', (e) => {
                const isChecked = e.target.checked;
                const productName = card.querySelector('.product-title').textContent;
                const productPriceText = card.querySelector('.product-price').textContent.replace(/[^0-9.]+/g, "").trim();
                const productPrice = parseFloat(productPriceText);
                if (productId && productName && !isNaN(productPrice)) {
                    addToCart(productId, productName, productPrice, isChecked);
                } else {
                    e.target.checked = !isChecked;
                }
            });
        }
        if (minusBtn) minusBtn.addEventListener('click', () => updateQuantity(productId, -1));
        if (plusBtn) plusBtn.addEventListener('click', () => updateQuantity(productId, 1));

        card.querySelectorAll('.sizes input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', () => {
                if (addToCartCheckbox.checked) {
                    const productName = card.querySelector('.product-title').textContent;
                    const productPriceText = card.querySelector('.product-price').textContent.replace(/[^0-9.]+/g, "").trim();
                    const productPrice = parseFloat(productPriceText);
                    addToCart(productId, productName, productPrice, true);
                }
            });
        });
    });

    cartItemsList.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-item-btn')) {
            const productIdToRemove = e.target.dataset.id;
            const sizeToRemove = e.target.dataset.size;
            const colorToRemove = e.target.dataset.color;
            removeItemFromCart(productIdToRemove, sizeToRemove, colorToRemove);
        }
    });

    if (paymentTriggerBtn) paymentTriggerBtn.addEventListener('click', showDeliveryForm);
    if (finalCheckoutBtn) finalCheckoutBtn.addEventListener('click', sendOrderViaWhatsApp);

    // Mobile menu toggle
    const menuIcon = document.getElementById('menu-icon');
    const navLinks = document.getElementById('nav-links');
    if (menuIcon && navLinks) {
        menuIcon.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            menuIcon.classList.toggle('active');
        });
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                setTimeout(() => {
                    navLinks.classList.remove('active');
                    menuIcon.classList.remove('active');
                }, 150);
            });
        });
    }

    updateCartDisplay();
});

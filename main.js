document.addEventListener('DOMContentLoaded', () => {
    // --- Variables ---
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

    // Mobile menu toggle
    const menuIcon = document.getElementById('menu-icon');
    const navLinks = document.getElementById('nav-links');

    let cart = [];

    // --- Delivery Constants ---
    const deliveryCostFixed = 60; // تكلفة التوصيل ثابتة لأي مكان

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

    function findCartItemIndex(productId, size, color) {
        return cart.findIndex(item => item.id === productId && item.size === size && item.color === color);
    }

    function addToCart(productId, productName, productPrice, isChecked) {
        const productCard = document.querySelector(`.product-card[data-id="${productId}"]`);
        if (!productCard) return;
        const quantityInput = productCard.querySelector('.quantity-input');
        const quantity = parseInt(quantityInput.value) || 1;
        const selectedSize = getSelectedSize(productCard);
        const selectedColor = getSelectedColor(productCard);
        const checkbox = productCard.querySelector('.input.add-to-cart');

        if (!selectedSize && isChecked) {
            alert("من فضلك اختار المقاس أولاً لإضافة المنتج للسلة.");
            if (checkbox) checkbox.checked = false;
            return;
        }

        const existingItemIndex = findCartItemIndex(productId, selectedSize, selectedColor);

        if (isChecked && selectedSize) {
            if (existingItemIndex > -1) {
                cart[existingItemIndex].quantity = quantity;
            } else {
                cart.push({ id: productId, name: productName, price: productPrice, quantity: quantity, size: selectedSize, color: selectedColor });
            }
        } else if (!isChecked) {
            if (existingItemIndex > -1) removeItemFromCart(productId, selectedSize, selectedColor, false);
        } else if (isChecked && !selectedSize) {
            if (checkbox) checkbox.checked = false;
        }

        updateCartDisplay();
    }

    function updateQuantity(productId, change) {
        const productCard = document.querySelector(`.product-card[data-id="${productId}"]`);
        if (!productCard) return;
        const quantityInput = productCard.querySelector('.quantity-input');
        let currentQuantity = parseInt(quantityInput.value) || 1;
        const newQuantity = currentQuantity + change;

        if (newQuantity >= 1) {
            quantityInput.value = newQuantity;
            
            const selectedSize = getSelectedSize(productCard);
            const selectedColor = getSelectedColor(productCard);
            const checkbox = productCard.querySelector('.input.add-to-cart');

            if (checkbox.checked && selectedSize) {
                const itemIndex = findCartItemIndex(productId, selectedSize, selectedColor);
                if (itemIndex > -1) {
                    cart[itemIndex].quantity = newQuantity;
                    updateCartDisplay();
                } else {
                    const productName = productCard.querySelector('.product-title').textContent;
                    const productPriceText = productCard.querySelector('.product-price').textContent.replace(/[^0-9.]+/g, "").trim();
                    const productPrice = parseFloat(productPriceText);
                    addToCart(productId, productName, productPrice, true);
                }
            }
        }
    }

    function removeItemFromCart(productId, size, color, updateCheckbox = true) {
        cart = cart.filter(item => !(item.id === productId && item.size === size && item.color === color));

        if (updateCheckbox) {
            const productCard = document.querySelector(`.product-card[data-id="${productId}"]`);
            if (productCard) {
                const allVariantsRemoved = cart.filter(item => item.id === productId).length === 0;
                if (allVariantsRemoved) {
                    const checkbox = productCard.querySelector('.input.add-to-cart');
                    if (checkbox) checkbox.checked = false;
                    const quantityInput = productCard.querySelector('.quantity-input');
                    if (quantityInput) quantityInput.value = 1;
                    const sizeRadios = productCard.querySelectorAll('.sizes input[type="radio"]');
                    sizeRadios.forEach(radio => radio.checked = false);
                }
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
            alert('عربة التسوق فارغة! لا يمكن إتمام الطلب.');
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
            alert('يرجى ملء جميع حقول الاستلام الإلزامية (الاسم، الهاتف، العنوان).'); 
            return;
        }

        let orderDetailsString = "";
        let totalOrderPrice = 0;

        cart.forEach(item => {
           orderDetailsString += `- ${item.name} | المقاس: ${item.size} | اللون: ${item.color} | الكمية: ${item.quantity} | السعر الإفرادي: ${item.price.toFixed(2)} ج.م\n`;
           totalOrderPrice += item.price * item.quantity;
        });

        // ✅ التوصيل ثابت لأي مكان
        const currentDeliveryCost = deliveryCostFixed;
        const finalTotalPrice = totalOrderPrice + currentDeliveryCost;
        const deliveryAreaInfo = `(سعر التوصيل ثابت: ${deliveryCostFixed} ج.م)`;

        const whatsappMessage = `
*--- تفاصيل طلب جديد - CODE FASHION ---*
*بيانات العميل:*
الاسم: ${inputFullName.value.trim()}
رقم الهاتف: ${inputPhoneNumber.value.trim()}
العنوان: ${inputAddress.value.trim()}
وقت التسليم المفضل: ${inputDeliveryTime.value.trim() || 'غير محدد'}
------------------------------
*المنتجات المطلوبة:*
${orderDetailsString}
------------------------------
*ملخص الدفع:*
مجموع أسعار المنتجات: ${totalOrderPrice.toFixed(2)} ج.م
تكلفة التوصيل: ${currentDeliveryCost} ج.م ${deliveryAreaInfo}
*الإجمالي النهائي المطلوب دفعه:* ${finalTotalPrice.toFixed(2)} ج.م
        `;

        const encodedMessage = encodeURIComponent(whatsappMessage);
        const phoneNumber = '201017925907';
        const whatsappLink = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
        
        window.open(whatsappLink, '_blank');
        
        cart = [];
        updateCartDisplay(); 
        closeCartModal();
    }

    function updateCartDisplay() {
        cartItemsList.innerHTML = '';
        let total = 0;
        let totalItems = 0;

        if (cart.length === 0) {
            cartItemsList.innerHTML = `<li style="text-align: center; color: var(--light-text-color);">عربة التسوق فارغة.</li>`;
            cartTotalPrice.textContent = `0.00 ج.م`;
            if(paymentTriggerBtn) paymentTriggerBtn.style.display = 'none';
        } else {
            if(paymentTriggerBtn) paymentTriggerBtn.style.display = 'block';
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
                    <button class="remove-item-btn btn" data-id="${item.id}" data-size="${item.size}" data-color="${item.color}" style="background-color: #f44336; color: white; padding: 5px 10px; font-size: 0.8rem; border-radius: 5px;">إزالة</button>
                `;
                cartItemsList.appendChild(listItem);
                total += itemTotal;
                totalItems += item.quantity;
            });
            cartTotalPrice.textContent = `${total.toFixed(2)} ج.م`;
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

    if (floatingCartButton) floatingCartButton.addEventListener('click', (e) => { e.preventDefault(); openCartModal(); });
    if (closeModalButton) closeModalButton.addEventListener('click', closeCartModal);
    if (cartModal) window.addEventListener('click', (event) => { if (event.target === cartModal) closeCartModal(); });

    document.querySelectorAll('.product-card').forEach(card => {
        const productId = card.dataset.id;
        const addToCartCheckbox = card.querySelector('.input.add-to-cart'); 
        const minusBtn = card.querySelector('.minus-btn');
        const plusBtn = card.querySelector('.plus-btn');
        const productImg = card.querySelector('img');
        const colorDots = card.querySelectorAll('.color-dot');
        const sizeRadios = card.querySelectorAll('.sizes input[type="radio"]');

        if (colorDots.length > 0 && !card.querySelector('.color-dot.selected')) {
            colorDots[0].classList.add('selected'); 
        }

        colorDots.forEach(dot => {
            dot.addEventListener('click', () => {
                const img = dot.getAttribute('data-image');
                productImg.src = img;
                colorDots.forEach(d => d.classList.remove('selected'));
                dot.classList.add('selected');
                if (addToCartCheckbox.checked) {
                    const productName = card.querySelector('.product-title').textContent;
                    const productPriceText = card.querySelector('.product-price').textContent.replace(/[^0-9.]+/g, "").trim();
                    const productPrice = parseFloat(productPriceText);
                    addToCart(productId, productName, productPrice, true);
                }
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

        sizeRadios.forEach(radio => {
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

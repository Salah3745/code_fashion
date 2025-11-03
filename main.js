document.addEventListener('DOMContentLoaded', () => {
    // --- Variables ---
    const languageToggleBtn = document.getElementById('language-toggle');
    const darkModeToggleBtn = document.getElementById('dark-mode-toggle');
    const cartButton = document.getElementById('cart-button'); // Button in header
    const floatingCartButton = document.getElementById('floating-cart-button'); // Floating button
    const cartModal = document.getElementById('cart-modal');
    const closeModalButton = document.getElementById('close-modal');
    const cartItemsList = document.getElementById('cart-items-list');
    const cartTotalPrice = document.getElementById('cart-total-price');
    const cartItemCountFloating = floatingCartButton ? floatingCartButton.querySelector('.cart-item-count-svg') : null; // Counter for the floating button
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    const paymentTriggerBtn = document.querySelector('.payment-trigger-btn'); // Button to switch to delivery form
    const finalCheckoutBtn = document.getElementById('final-checkout-btn'); // The actual submit order button

    // Delivery Form Elements
    const deliveryForm = document.getElementById('delivery-form');
    const paymentFormContainer = document.querySelector('.payment-form-container');
    const cartItemsSection = document.getElementById('cart-items-section'); // Section containing original cart items
    const paymentOptionsButtons = document.querySelectorAll('.payment--options button');
    const inputFullName = document.getElementById('full_name');
    const inputPhoneNumber = document.getElementById('phone_number');
    const inputAddress = document.getElementById('address');
    const inputDeliveryTime = document.getElementById('delivery_time');

    let currentLanguage = localStorage.getItem('language') || 'ar'; // Default to Arabic
    let currentMode = localStorage.getItem('darkMode') || 'light'; // Default to light mode

    let cart = []; // Array to store cart items

    // --- Delivery Cost Variables ---
    const deliveryCostEgyptMadaeen = 25; // تكلفة التوصيل للمعادي وحدائق المعادي ودار السلام
    const deliveryCostOtherLocations = 40; // تكلفة التوصيل لأي مكان آخر

    // --- Functions ---

    // 1. Language Toggle Functionality
    function toggleLanguage() {
        currentLanguage = currentLanguage === 'ar' ? 'en' : 'ar';
        localStorage.setItem('language', currentLanguage);
        applyLanguage(currentLanguage);
    }

    function applyLanguage(lang) {
        const langToggleBtn = document.getElementById('language-toggle');
        const body = document.body;

    }


    // 2. Dark Mode Functionality
    function toggleDarkMode() {
        currentMode = currentMode === 'light' ? 'dark' : 'light';
        localStorage.setItem('darkMode', currentMode);
        applyDarkMode(currentMode);
    }

    function applyDarkMode(mode) {
        const body = document.body;
        if (mode === 'dark') {
            body.classList.add('dark-mode');
        } else {
            body.classList.remove('dark-mode');
        }
    }

    // 3. Shopping Cart Functionality
    function addToCart(productId, productName, productPrice) {
        const productCard = document.querySelector(`.product-card[data-id="${productId}"]`);

        if (!productCard) {
            console.error("Product card not found for ID:", productId);
            return;
        }

        const quantityInput = productCard.querySelector('.quantity-input');
        const quantity = parseInt(quantityInput.value);

        if (isNaN(quantity) || quantity < 1) {
            alert(currentLanguage === 'ar' ? 'يرجى تحديد كمية صحيحة.' : 'Please select a valid quantity.');
            return;
        }

        const existingItemIndex = cart.findIndex(item => item.id === productId);
        
        if (existingItemIndex > -1) {
            cart[existingItemIndex].quantity = quantity;
        } else {
            cart.push({ id: productId, name: productName, price: productPrice, quantity: quantity });
        }
        
        updateCartDisplay();
        // تعديل بسيط هنا لجعل الرسالة أكثر وضوحاً
        const addedMessage = currentLanguage === 'ar' 
            ? `تمت إضافة ${productName} (الكمية: ${quantity}) إلى السلة!`
            : `Added ${productName} (Quantity: ${quantity}) to cart!`;
        alert(addedMessage);
    }

    function updateQuantity(productId, change) {
        const productCard = document.querySelector(`.product-card[data-id="${productId}"]`);
        if (!productCard) return;

        const quantityInput = productCard.querySelector('.quantity-input');
        let currentQuantity = parseInt(quantityInput.value);

        if (isNaN(currentQuantity)) currentQuantity = 1;

        const newQuantity = currentQuantity + change;

        if (newQuantity >= 1) {
            quantityInput.value = newQuantity;
            const itemIndex = cart.findIndex(item => item.id === productId);
            if (itemIndex > -1) {
                cart[itemIndex].quantity = newQuantity;
                updateCartDisplay();
            }
        }
    }

    function removeItemFromCart(productId) {
        cart = cart.filter(item => item.id !== productId);
        
        const productCard = document.querySelector(`.product-card[data-id="${productId}"]`);
        if (productCard) {
            const quantityInput = productCard.querySelector('.quantity-input');
            if (quantityInput) {
                quantityInput.value = 1;
            }
            const checkbox = productCard.querySelector('.input.add-to-cart');
            if (checkbox) checkbox.checked = false;
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
            // عند إغلاق المودال، أعد عرض قسم المنتجات وليس نموذج الدفع
            if(cartItemsSection) cartItemsSection.style.display = 'block';
            if(paymentFormContainer) paymentFormContainer.style.display = 'none';
        }
    }

    function showDeliveryForm() {
        if (cart.length === 0) {
            alert(currentLanguage === 'ar' ? 'عربة التسوق فارغة!' : 'Your shopping cart is empty!');
            return;
        }
        // إخفاء قسم المنتجات وإظهار نموذج الدفع
        if(cartItemsSection) cartItemsSection.style.display = 'none';
        if(paymentFormContainer) paymentFormContainer.style.display = 'block';
        resetDeliveryForm();
        // تحديث النص حسب اللغة
        updateDeliveryFormPlaceholders(currentLanguage);
    }

    function resetDeliveryForm() {
        if (deliveryForm) deliveryForm.reset(); // استخدم reset() لمسح كل الحقول
        // إعادة تعيين أزرار خيارات الدفع (إذا كانت موجودة)
        paymentOptionsButtons.forEach(btn => btn.classList.remove('selected'));
    }

    function updateDeliveryFormPlaceholders(lang) {
        const fullNameLabel = document.querySelector('label[for="full_name"]');
        const phoneNumberLabel = document.querySelector('label[for="phone_number"]');
        const addressLabel = document.querySelector('label[for="address"]');
        const deliveryTimeLabel = document.querySelector('label[for="delivery_time"]');
        const separatorText = document.querySelector('.separator p');
        const checkoutButton = document.getElementById('final-checkout-btn');
        const paymentTriggerButton = document.querySelector('.payment-trigger-btn'); // Button to go to payment

        if (lang === 'en') {
            if (fullNameLabel) fullNameLabel.textContent = 'Full Name';
            if (phoneNumberLabel) phoneNumberLabel.textContent = 'Phone Number';
            if (addressLabel) addressLabel.textContent = 'Full Address';
            if (deliveryTimeLabel) deliveryTimeLabel.textContent = 'Preferred Delivery Time';
            
            if (inputFullName) inputFullName.placeholder = 'Enter your full name';
            if (inputPhoneNumber) inputPhoneNumber.placeholder = 'Enter your phone number';
            if (inputAddress) inputAddress.placeholder = 'Enter your full address';
            if (inputDeliveryTime) inputDeliveryTime.placeholder = 'e.g., Morning, Afternoon, or specific time';
            
            if (separatorText) separatorText.textContent = 'or enter delivery details';
            if (checkoutButton) checkoutButton.textContent = 'Submit Order';
            if (paymentTriggerButton) paymentTriggerButton.textContent = 'Proceed to Payment'; // Update button text
        } else { // Arabic
            if (fullNameLabel) fullNameLabel.textContent = 'الاسم الكامل';
            if (phoneNumberLabel) phoneNumberLabel.textContent = 'رقم الهاتف';
            if (addressLabel) addressLabel.textContent = 'العنوان بالتفصيل';
            if (deliveryTimeLabel) deliveryTimeLabel.textContent = 'وقت التسليم المفضل';

            if (inputFullName) inputFullName.placeholder = 'ادخل اسمك الكامل';
            if (inputPhoneNumber) inputPhoneNumber.placeholder = 'ادخل رقم هاتفك';
            if (inputAddress) inputAddress.placeholder = 'ادخل عنوانك كاملاً';
            if (inputDeliveryTime) inputDeliveryTime.placeholder = 'مثال: صباحاً، بعد الظهر، أو وقت محدد';
            
            if (separatorText) separatorText.textContent = 'أو أدخل بيانات الاستلام';
            if (checkoutButton) checkoutButton.textContent = 'إتمام الطلب';
            if (paymentTriggerButton) paymentTriggerButton.textContent = 'الانتقال للدفع'; // Update button text
        }
    }

    function updateContactFormPlaceholders(lang) {
        const nameInput = document.querySelector('.contact-form input[type="text"]');
        const emailInput = document.querySelector('.contact-form input[type="email"]');
        const messageTextarea = document.querySelector('.contact-form textarea');

        if (lang === 'en') {
            if (nameInput) nameInput.placeholder = 'Your Name';
            if (emailInput) emailInput.placeholder = 'Your Email';
            if (messageTextarea) messageTextarea.placeholder = 'Your Message';
        } else { // Arabic
            if (nameInput) nameInput.placeholder = 'الاسم';
            if (emailInput) emailInput.placeholder = 'البريد الإلكتروني';
            if (messageTextarea) messageTextarea.placeholder = 'رسالتك';
        }
    }

    // === NEW FUNCTION: Send Order via WhatsApp ===
    function sendOrderViaWhatsApp() {
        // 1. التحقق من أن العربة ليست فارغة
        if (cart.length === 0) {
            alert(currentLanguage === 'ar' ? 'عربة التسوق فارغة!' : 'Your shopping cart is empty!');
            return;
        }

        // 2. جمع تفاصيل المنتجات في الطلب
        let orderDetailsString = "";
        let totalOrderPrice = 0;

        cart.forEach(item => {
            orderDetailsString += `- ${item.name} (الكمية: ${item.quantity}) - السعر: ${item.price.toFixed(2)} ${currentLanguage === 'ar' ? 'ج.م' : 'EGP'}\n`;
            totalOrderPrice += item.price * item.quantity;
        });

        // 3. جمع بيانات الاستلام من النموذج
        const inputFullName = document.getElementById('full_name');
        const inputPhoneNumber = document.getElementById('phone_number');
        const inputAddress = document.getElementById('address');
        const inputDeliveryTime = document.getElementById('delivery_time');

        // التحقق من ملء الحقول الإلزامية
        if (!inputFullName || !inputFullName.value.trim() || !inputPhoneNumber || !inputPhoneNumber.value.trim() || !inputAddress || !inputAddress.value.trim()) {
            alert(currentLanguage === 'ar' ? 'يرجى ملء جميع حقول الاستلام الإلزامية (الاسم، الهاتف، العنوان).' : 'Please fill in all required delivery fields (Name, Phone, Address).');
            return;
        }
        
        // حساب تكلفة التوصيل
        let currentDeliveryCost = 0;
        const lowerCaseAddress = inputAddress.value.trim().toLowerCase();
        if (lowerCaseAddress.includes('المعادي') || lowerCaseAddress.includes('حدائق المعادي') || lowerCaseAddress.includes('دار السلام')) {
            currentDeliveryCost = deliveryCostEgyptMadaeen;
        } else {
            currentDeliveryCost = deliveryCostOtherLocations;
        }

        const finalTotalPrice = totalOrderPrice + currentDeliveryCost;

        // 4. تجميع رسالة الواتساب الكاملة
        const whatsappMessage = `
--- تفاصيل طلب جديد ---
اسم العميل: ${inputFullName.value.trim()}
رقم الهاتف: ${inputPhoneNumber.value.trim()}
العنوان: ${inputAddress.value.trim()}
وقت التسليم المفضل: ${inputDeliveryTime && inputDeliveryTime.value.trim() ? inputDeliveryTime.value.trim() : 'غير محدد'}
--------------------
المنتجات المطلوبة:
${orderDetailsString}
--------------------
تكلفة التوصيل: ${currentDeliveryCost} ${currentLanguage === 'ar' ? 'ج.م' : 'EGP'}
الإجمالي النهائي: ${finalTotalPrice.toFixed(2)} ${currentLanguage === 'ar' ? 'ج.م' : 'EGP'}
        `;

        // 5. تشفير الرسالة لتكون صالحة للينك
        const encodedMessage = encodeURIComponent(whatsappMessage);

        // 6. رقم الهاتف (تأكد من صحته وخلوه من المسافات أو الرموز)
        // استخدام الرقم من اللينك الذي قدمته: 2001554728811
        const phoneNumber = '201016298335'; 

        // 7. بناء الرابط النهائي
        const whatsappLink = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

        // 8. توجيه المستخدم إلى رابط الواتساب في نافذة جديدة
        window.open(whatsappLink, '_blank');

        // 9. إظهار رسالة تأكيد للمستخدم
        alert(currentLanguage === 'ar' 
            ? `تم إرسال طلبك إلى واتساب لتأكيده. يرجى إكمال الخطوات هناك.\nتكلفة التوصيل: ${currentDeliveryCost} ${currentLanguage === 'ar' ? 'ج.م' : 'EGP'}`
            : `Your order has been sent to WhatsApp for confirmation. Please complete the steps there.\nDelivery Cost: ${currentDeliveryCost} ${currentLanguage === 'ar' ? 'EGP' : 'EGP'}`);

        // 10. (اختياري) إفراغ العربة وإغلاق المودال بعد إرسال الطلب
        // إذا أردت إفراغ العربة تلقائياً بعد الضغط على زر الإتمام:
        // cart = [];
        // updateCartDisplay();
        // closeCartModal();
    }

    // --- End of NEW FUNCTION ===

    // وظيفة لتحديث سلة التسوق (تم تعديلها قليلاً)
    function updateCartDisplay() {
        cartItemsList.innerHTML = '';
        let total = 0;
        let totalItems = 0;

        // ترتيب المنتجات حسب الـ ID لضمان ثبات الترتيب
        cart.sort((a, b) => a.id.localeCompare(b.id));

        if (cart.length === 0) {
            cartItemsList.innerHTML = `<li>${currentLanguage === 'ar' ? 'عربة التسوق فارغة.' : 'Your shopping cart is empty.'}</li>`;
            cartTotalPrice.textContent = `0.00 ${currentLanguage === 'ar' ? 'ج.م' : 'EGP'}`;
            
            // عند تفريغ العربة، تأكد من أن زر "الانتقال للدفع" لا يزال ظاهرًا
            if(paymentTriggerBtn) paymentTriggerBtn.style.display = 'block';
            if(cartItemsSection) cartItemsSection.style.display = 'block';
            if(paymentFormContainer) paymentFormContainer.style.display = 'none';
            
        } else {
            cart.forEach(item => {
                const listItem = document.createElement('li');
                const itemTotal = item.price * item.quantity;
                listItem.innerHTML = `
                    <span>${item.name}</span>
                    <span>${item.quantity} x ${item.price.toFixed(2)} ${currentLanguage === 'ar' ? 'ج.م' : 'EGP'}</span>
                    <span>${itemTotal.toFixed(2)} ${currentLanguage === 'ar' ? 'ج.م' : 'EGP'}</span>
                    <button class="remove-item-btn" data-id="${item.id}">${currentLanguage === 'ar' ? 'إزالة' : 'Remove'}</button>
                `;
                cartItemsList.appendChild(listItem);
                total += itemTotal;
                totalItems += item.quantity;
            });
            cartTotalPrice.textContent = `${total.toFixed(2)} ${currentLanguage === 'ar' ? 'ج.م' : 'EGP'}`;

            // تأكد من أن الأزرار تظهر بشكل صحيح عندما تكون العربة ممتلئة
            if(paymentTriggerBtn) paymentTriggerBtn.style.display = 'block';
            if(cartItemsSection) cartItemsSection.style.display = 'block';
            if(paymentFormContainer) paymentFormContainer.style.display = 'none';
        }
        
        updateCartIconCounters(totalItems);
    }

    // Function to update the item count on cart icons
    function updateCartIconCounters(count) {
        const floatingCartCounter = cartItemCountFloating;
        
        if (floatingCartCounter) {
            if (count > 0) {
                floatingCartCounter.textContent = count;
                floatingCartCounter.style.display = 'flex'; // Use flex to center the number if needed
            } else {
                floatingCartCounter.style.display = 'none';
            }
        }
    }

    // --- Event Listeners ---

    // Language Toggle
    if (languageToggleBtn) {
        languageToggleBtn.addEventListener('click', toggleLanguage);
    }

    // Dark Mode Toggle
    if (darkModeToggleBtn) {
        darkModeToggleBtn.addEventListener('click', toggleDarkMode);
    }

    // Cart Button - Open Modal (Header Cart Button)
    if (cartButton) {
        cartButton.addEventListener('click', openCartModal);
    }

    // Floating Cart Button - Open Modal
    if (floatingCartButton) {
        floatingCartButton.addEventListener('click', (e) => {
            e.preventDefault(); // منع السلوك الافتراضي للينك
            openCartModal();
        });
    }

    // Close Modal Button
    if (closeModalButton) {
        closeModalButton.addEventListener('click', closeCartModal);
    }

    // Close Modal if clicked outside of content
    if (cartModal) {
        window.addEventListener('click', (event) => {
            // تأكد أننا ننقر خارج الـ modal-content
            if (event.target === cartModal) {
                closeCartModal();
            }
        });
    }

    // Add to Cart Buttons & Quantity Control
    document.querySelectorAll('.product-card').forEach(card => {
        const productId = card.dataset.id; // استخدام data-id مباشرة
        const addToCartCheckbox = card.querySelector('.input.add-to-cart'); 
        const minusBtn = card.querySelector('.minus-btn');
        const plusBtn = card.querySelector('.plus-btn');

        // إذا لم تكن هناك أزرار +/-، يمكنك إضافتها هنا أو التأكد من وجودها في HTML

        // Event listener for the checkbox (Add to Cart toggle)
        if (addToCartCheckbox) {
            addToCartCheckbox.addEventListener('change', (e) => {
                const isChecked = e.target.checked;
                const productName = card.querySelector('.product-title').textContent;
                // استخراج السعر وتنظيفه
                const productPriceStr = card.querySelector('.product-price').textContent.replace(/[^0-9.-]+/g, "");
                const productPrice = parseFloat(productPriceStr);

                if (productId && productName && !isNaN(productPrice)) {
                    if (isChecked) {
                        addToCart(productId, productName, productPrice);
                    } else {
                        removeItemFromCart(productId);
                    }
                } else {
                    console.error('Could not get product details for:', card);
                    e.target.checked = !isChecked; // إعادة الحالة إلى ما كانت عليه
                }
            });
        }
        
        // Event listeners for quantity buttons
        if (minusBtn) {
            minusBtn.addEventListener('click', () => updateQuantity(productId, -1));
        }
        if (plusBtn) {
            plusBtn.addEventListener('click', () => updateQuantity(productId, 1));
        }
    });

    // Remove Item Button from Cart Modal
    cartItemsList.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-item-btn')) {
            const productIdToRemove = e.target.dataset.id;
            removeItemFromCart(productIdToRemove);
        }
    });

    // Button to trigger showing the delivery form
    if (paymentTriggerBtn) {
        paymentTriggerBtn.addEventListener('click', showDeliveryForm);
    }

    // Handle final order submission from the delivery form - NOW TRIGGERS WHATSAPP
    if (finalCheckoutBtn) {
        finalCheckoutBtn.addEventListener('click', sendOrderViaWhatsApp); // <<-- تم التعديل هنا
    }
    
    // Handle payment option button clicks (visual selection)
    paymentOptionsButtons.forEach(button => {
        button.addEventListener('click', () => {
            paymentOptionsButtons.forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
        });
    });

    // --- Initial Setup ---
    // تطبيق اللغة والوضع الليلي عند تحميل الصفحة
    applyLanguage(currentLanguage);
    applyDarkMode(currentMode);
    updateCartDisplay(); // تحديث عرض العربة عند التحميل (لعرض المنتجات المحفوظة إذا كانت موجودة)
    updateContactFormPlaceholders(currentLanguage);
    updateDeliveryFormPlaceholders(currentLanguage); // تأكد من تحديث الحقول حسب اللغة عند التحميل
});

// --- Mobile Menu Toggle ---
// هذا الجزء يبدو أنه مكرر في الكود الأصلي، يفضل دمجه مع DOMContentLoaded الرئيسي
// أو التأكد من عدم وجود تعارض. سأبقي عليه هنا للحفاظ على الكود الأصلي.
document.addEventListener('DOMContentLoaded', () => { 
  const menuIcon = document.getElementById('menu-icon');
  const navLinks = document.getElementById('nav-links');

  if (menuIcon && navLinks) {
    menuIcon.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      menuIcon.classList.toggle('active');
    });
    
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        menuIcon.classList.remove('active');
      });
    });
  }

  // --- Dark Mode Toggle (redundant if already handled in main.js, but safe) ---
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  const body = document.body;

  const savedTheme = localStorage.getItem('darkMode');
  if (savedTheme === 'dark') {
    body.classList.add('dark-mode');
  } else {
    body.classList.remove('dark-mode');
  }

  if (darkModeToggle) { // تأكد من وجود الزر قبل إضافة المستمع
      darkModeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        if (body.classList.contains('dark-mode')) {
          localStorage.setItem('darkMode', 'dark');
        } else {
          localStorage.setItem('darkMode', 'light');
        }
      }); 
  }
});
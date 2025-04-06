document.addEventListener('DOMContentLoaded', function() {
    const calculateBtn = document.getElementById('calculate-btn');
    const salePriceInput = document.getElementById('salePrice');
    const cashPaymentInput = document.getElementById('cashPayment');
    const loanAmountInput = document.getElementById('loanAmount');
    const operatingCostInput = document.getElementById('operatingCost');
    const mortgageDeedInput = document.getElementById('mortgageDeed');
    const interestRateInput = document.getElementById('interestRate');
    
    // Load saved values from local storage
    loadSavedValues();
    
    // Calculate loan amount when sale price or cash payment changes
    salePriceInput.addEventListener('input', function() {
        calculateLoanAmount();
        saveToLocalStorage();
    });
    
    cashPaymentInput.addEventListener('input', function() {
        calculateLoanAmount();
        saveToLocalStorage();
    });
    
    // Save other input values when they change
    operatingCostInput.addEventListener('input', saveToLocalStorage);
    mortgageDeedInput.addEventListener('input', saveToLocalStorage);
    interestRateInput.addEventListener('input', saveToLocalStorage);
    
    function calculateLoanAmount() {
        const salePrice = parseFloat(salePriceInput.value) || 0;
        const cashPayment = parseFloat(cashPaymentInput.value) || 0;
        
        // Make sure cash payment doesn't exceed sale price
        if (cashPayment > salePrice) {
            cashPaymentInput.value = salePrice;
            loanAmountInput.value = 0;
        } else {
            const loanAmount = salePrice - cashPayment;
            loanAmountInput.value = loanAmount;
        }
    }
    
    function saveToLocalStorage() {
        const formData = {
            salePrice: salePriceInput.value,
            cashPayment: cashPaymentInput.value,
            operatingCost: operatingCostInput.value,
            mortgageDeed: mortgageDeedInput.value,
            interestRate: interestRateInput.value
        };
        
        localStorage.setItem('bostadskalkylatorData', JSON.stringify(formData));
    }
    
    function loadSavedValues() {
        try {
            const savedData = localStorage.getItem('bostadskalkylatorData');
            
            if (savedData) {
                const formData = JSON.parse(savedData);
                
                // Populate form fields with saved data
                salePriceInput.value = formData.salePrice || '';
                cashPaymentInput.value = formData.cashPayment || '';
                operatingCostInput.value = formData.operatingCost || '';
                mortgageDeedInput.value = formData.mortgageDeed || '';
                interestRateInput.value = formData.interestRate || '';
                
                // Calculate loan amount based on loaded values
                calculateLoanAmount();
            }
        } catch (error) {
            console.error('Error loading saved data:', error);
            // If there's an error, clear the storage to prevent future errors
            localStorage.removeItem('bostadskalkylatorData');
        }
    }
    
    calculateBtn.addEventListener('click', function() {
        calculateAll();
        // Save values after calculation too
        saveToLocalStorage();
    });
    
    // Also calculate when pressing Enter in any input field
    const inputs = document.querySelectorAll('input[type="number"]:not([readonly])');
    inputs.forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                calculateAll();
                saveToLocalStorage();
            }
        });
    });
    
    function calculateAll() {
        // Get input values
        const salePrice = getInputValue('salePrice');
        const operatingCost = getInputValue('operatingCost');
        const mortgageDeed = getInputValue('mortgageDeed');
        const loanAmount = getInputValue('loanAmount');
        const cashPayment = getInputValue('cashPayment');
        const interestRate = getInputValue('interestRate') / 100; // Convert to decimal
        
        // Validate inputs
        if (!validateInputs(salePrice, operatingCost, mortgageDeed, interestRate)) {
            return;
        }
        
        // Calculate costs
        const titleDeedCost = salePrice * 0.015;
        // Fixed the pantbrev calculation - it should calculate additional mortgage deed needed
        // If loan exceeds existing mortgage deeds, new ones are needed at a cost of 2%
        const mortgageDeedCost = Math.max(0, (loanAmount - mortgageDeed) * 0.02);
        const totalLP = titleDeedCost + mortgageDeedCost;
        const totalCashLP = cashPayment + totalLP;
        
        // Calculate monthly costs
        const yearlyInterestCost = loanAmount * interestRate;
        const monthlyInterestCost = yearlyInterestCost / 12;
        const amortization = 0.01 * loanAmount / 12;
        const interestAfterTax = calculateInterestAfterTax(yearlyInterestCost) / 12;
        
        // Total monthly cost - explicitly include operating cost
        const totalMonthly = operatingCost + interestAfterTax + amortization;
        
        // Display results
        displayResult('titleDeedCost', formatCurrency(titleDeedCost));
        displayResult('mortgageDeedCost', formatCurrency(mortgageDeedCost));
        displayResult('totalLP', formatCurrency(totalLP));
        displayResult('totalCashLP', formatCurrency(totalCashLP));
        
        // Display monthly costs including operating cost as a separate item
        displayResult('monthlyOperatingCost', formatCurrency(operatingCost));
        displayResult('yearlyInterestCost', formatCurrency(yearlyInterestCost));
        displayResult('monthlyInterestCost', formatCurrency(monthlyInterestCost));
        displayResult('amortization', formatCurrency(amortization));
        displayResult('interestAfterTax', formatCurrency(interestAfterTax));
        displayResult('totalMonthly', formatCurrency(totalMonthly));
    }
    
    function validateInputs(...inputs) {
        for (const input of inputs) {
            if (isNaN(input) || input < 0) {
                alert('Vänligen ange giltiga värden i alla fält');
                return false;
            }
        }
        return true;
    }
    
    function getInputValue(id) {
        return parseFloat(document.getElementById(id).value) || 0;
    }
    
    function displayResult(id, value) {
        document.getElementById(id).textContent = value;
    }
    
    function formatCurrency(amount) {
        return new Intl.NumberFormat('sv-SE', { 
            style: 'currency', 
            currency: 'SEK',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }
    
    function calculateInterestAfterTax(yearlyInterest) {
        let taxReduction;
        
        if (yearlyInterest <= 200000) {
            taxReduction = 0.30 * yearlyInterest;
        } else {
            taxReduction = (0.30 * 200000) + (0.21 * (yearlyInterest - 200000));
        }
        
        return yearlyInterest - taxReduction;
    }
    
    // Initialize loan amount calculation
    calculateLoanAmount();
});

import json
import uuid

# Configuration matching the requested hierarchy
DEFAULT_ITEMS = {
    'Salary': ['Monthly Salary', 'Bonus', 'Incentives'],
    'Business': ['Business Profit', 'Side Business'],
    'Freelance': ['Client Work', 'Contract Work'],
    'Interest': ['Bank Interest', 'FD Interest'],
    'Rental Income': ['House Rent', 'Shop Rent'],
    'Other Income': ['Cashback', 'Refunds'],
    
    'Food & Dining': ['Groceries', 'Restaurants', 'Snacks', 'Food Delivery'],
    'Transport': ['Fuel', 'Ride Hailing', 'Public Transport', 'Vehicle Maintenance'],
    'Housing': ['Rent', 'Maintenance', 'Electricity', 'Water'],
    'Bills & Utilities': ['Mobile Recharge', 'Internet', 'Gas', 'DTH / Cable', 'Subscriptions'],
    'Shopping': ['Clothes', 'Accessories', 'Online Shopping'],
    'Health & Medical': ['Doctor Visits', 'Medicines', 'Insurance Premiums'],
    'Education': ['School / College Fees', 'Courses', 'Books'],
    'Entertainment': ['Movies', 'Games', 'Events'],
    'Personal Care': ['Salon', 'Grooming', 'Cosmetics', 'Fitness / Gym'],
    'Travel': ['Trips', 'Hotels', 'Transport'],
    'Gifts & Donations': ['Gifts', 'Charity'],
    'EMIs / Loans': ['Education Loan', 'Personal Loan', 'Credit Card EMI'],
    'Others': ['Miscellaneous', 'Uncategorized Expenses'],
    
    'Stocks': ['Equity', 'IPO'],
    'Mutual Funds': ['SIP', 'Lump Sum'],
    'Gold': ['Physical Gold', 'Digital Gold'],
    'Crypto': ['Bitcoin', 'Altcoins'],
    'Fixed Deposit': ['Bank FD', 'Corporate FD'],
    'Real Estate': ['Land', 'Property'],
    'Other Investments': ['Bonds', 'PPF / NPS']
}

def migrate():
    try:
        with open('src/data/db.json', 'r') as f:
            data = json.load(f)
        
        users = data.get('users', [])
        categories = data.get('categories', [])
        items = data.get('items', [])
        
        new_items_count = 0
        
        print(f"Checking {len(users)} users...")
        
        for user in users:
            user_email = user.get('email')
            if not user_email:
                continue
                
            # Get user's categories
            user_cats = [c for c in categories if c.get('email') == user_email]
            
            for cat in user_cats:
                cat_name = cat.get('name')
                
                # Check if this category has default items defined
                if cat_name in DEFAULT_ITEMS:
                    # Get existing items for this specific category
                    existing_items = [i['name'] for i in items if i.get('categoryId') == cat['id']]
                    
                    # Add missing default items
                    for default_item_name in DEFAULT_ITEMS[cat_name]:
                        if default_item_name not in existing_items:
                            # Create new item
                            new_item = {
                                "id": str(uuid.uuid4()),
                                "name": default_item_name,
                                "categoryId": cat['id'],
                                "email": user_email
                            }
                            items.append(new_item)
                            new_items_count += 1
        
        data['items'] = items
        
        with open('src/data/db.json', 'w') as f:
            json.dump(data, f, indent=2)
            
        print(f"Migration successful! {new_items_count} new items added to sync with the updated schema.")
        
    except Exception as e:
        print(f"Error during migration: {e}")

if __name__ == "__main__":
    migrate()

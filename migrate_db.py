
import json
import uuid

DB_PATH = '/Users/srinivas/Documents/Projects/SmartExpenseTracker/src/data/db.json'

def migrate():
    with open(DB_PATH, 'r') as f:
        data = json.load(f)

    users = data.get('users', [])
    existing_categories = data.get('categories', [])
    existing_items = data.get('items', [])
    
    # We will clear global categories/items and repopulate them per user
    new_categories = []
    new_items = []
    
    # Map old global IDs to new user-specific IDs to migrate transactions/budgets later if needed
    # But for now, we are just creating fresh default sets as per user request.
    # User said: "categories ... need be in every accout which will later create."
    # AND "i created 2 account ... same date appear in both account even though i add data only in one account"
    # So we basically want to cloning the 'default' structure for each user.
    
    # Let's identify the 'default' structure from the current DB
    # We assume the current `existing_categories` ARE the defaults.
    
    defaults_cats = existing_categories
    defaults_items = existing_items

    user_cat_map = {} # (user_id, old_cat_id) -> new_cat_id
    user_item_map = {} # (user_id, old_item_id) -> new_item_id

    for user in users:
        user_email = user['email']
        user_id = user['id']
        print(f"Migrating for user: {user_email}")

        # specific_user_cats = []
        
        for cat in defaults_cats:
            new_id = str(uuid.uuid4())
            new_cat = cat.copy()
            new_cat['id'] = new_id
            new_cat['email'] = user_email # Link to email as requested
            new_categories.append(new_cat)
            
            user_cat_map[(user_id, cat['id'])] = new_id

            # Find items for this category
            related_items = [i for i in defaults_items if i['categoryId'] == cat['id']]
            for item in related_items:
                new_item_id = str(uuid.uuid4())
                new_item = item.copy()
                new_item['id'] = new_item_id
                new_item['categoryId'] = new_id
                new_item['email'] = user_email
                new_items.append(new_item)
                
                user_item_map[(user_id, item['id'])] = new_item_id

    # Now migrate transactions
    # The user complained data appears in both accounts. This means transactions currently 
    # reference global categories. We need to assign transactions to the correct user's new private category.
    # Transactions ALREADY have a userId.
    
    new_transactions = []
    for txn in data.get('transactions', []):
        txn_user_id = txn.get('userId')
        # Some older txns might not have userId? 
        # Looking at file, transactions 1-8 don't have userId. 
        # We should probably assign them to the first user or delete them.
        # User said "i created 2 account".
        # Let's assign orphans to the first user if exists.
        
        if not txn_user_id and users:
             txn_user_id = users[0]['id']
             txn['userId'] = txn_user_id # Patch userId
        
        if txn_user_id:
            # Update category_id and item_id
            # Note: schema uses 'category_id' or 'category' depending on age of record.
            # Recent ones use 'category_id' and 'item_id'.
            
            # map old category_id to new one for this user
            old_cat_id = txn.get('category_id')
            if old_cat_id and (txn_user_id, old_cat_id) in user_cat_map:
                txn['category_id'] = user_cat_map[(txn_user_id, old_cat_id)]
            
            old_item_id = txn.get('item_id')
            if old_item_id and (txn_user_id, old_item_id) in user_item_map:
                txn['item_id'] = user_item_map[(txn_user_id, old_item_id)]
                
            # Add email to transaction as requested
            user_obj = next((u for u in users if u['id'] == txn_user_id), None)
            if user_obj:
                txn['email'] = user_obj['email']
                
            new_transactions.append(txn)

    # Budgets migration?
    new_budgets = []
    # Budgets don't seem to have userId in the sample!! 
    # This is bad. They only have category_id. 
    # This means budgets are currently shared globally! 
    # Since we can't know who created them, we might have to drop them or copy them for all users?
    # Or maybe just the first user. 
    # Given the user just created accounts to test, dropping budgets or assigning to first user is safer.
    # Let's assign to first user to be safe.
    
    if users:
        first_user = users[0]
        for bud in data.get('budgets', []):
             # Assign to first user
             old_cat_id = bud.get('category_id')
             old_item_id = bud.get('item_id')
             
             if (first_user['id'], old_cat_id) in user_cat_map:
                 bud['category_id'] = user_cat_map[(first_user['id'], old_cat_id)]
             
             if (first_user['id'], old_item_id) in user_item_map:
                 bud['item_id'] = user_item_map[(first_user['id'], old_item_id)]
                 
             bud['email'] = first_user['email']
             new_budgets.append(bud)


    data['categories'] = new_categories
    data['items'] = new_items
    data['transactions'] = new_transactions
    data['budgets'] = new_budgets

    with open(DB_PATH, 'w') as f:
        json.dump(data, f, indent=2)
    
    print("Migration complete.")

if __name__ == "__main__":
    migrate()

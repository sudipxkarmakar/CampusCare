import pandas as pd
import os

DATA_PATH = "data/complaints.csv"

def balance_dataset():
    if not os.path.exists(DATA_PATH):
        print("Error: data/complaints.csv not found")
        return

    df = pd.read_csv(DATA_PATH)
    print(f"Original size: {len(df)}")
    
    # 1. Remove duplicates of "Power bank caught fire"
    caught_fire_mask = df['text'].str.contains("Power bank caught fire", case=False, na=False)
    caught_fire_df = df[caught_fire_mask]
    
    if len(caught_fire_df) > 1:
        df = df[~caught_fire_mask] 
        df = pd.concat([df, caught_fire_df.iloc[:1]])
        print("Reduced 'caught fire' examples to 1.")
        
    # 2. Remove duplicates of "Lost ID card" (Other)
    # This is likely flooding the "Other" category
    id_card_mask = df['text'].str.contains("Lost ID card", case=False, na=False)
    id_card_df = df[id_card_mask]
    print(f"Found {len(id_card_df)} 'Lost ID card' examples.")
    
    if len(id_card_df) > 5:
        df = df[~id_card_mask]
        # Keep only 5 to represent the pattern but not overwhelm
        df = pd.concat([df, id_card_df.iloc[:5]])
        print("Reduced 'Lost ID card' examples to 5.")

    # 3. Amplify ALL "Personal" examples
    personal_mask = (df['category'] == 'Personal')
    personal_df = df[personal_mask]
    print(f"Found {len(personal_df)} 'Personal' examples.")
    
    if len(personal_df) > 0:
        # Duplicate them 10 times to boost signal
        augmented_df = pd.concat([personal_df] * 10, ignore_index=True)
        df = pd.concat([df, augmented_df], ignore_index=True)
        print(f"Added {len(augmented_df)} augmented Personal examples.")

    # 4. Save back
    df.to_csv(DATA_PATH, index=False)
    print(f"New size: {len(df)}")
    print("Dataset balanced.")

if __name__ == "__main__":
    balance_dataset()

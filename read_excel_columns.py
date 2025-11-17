import pandas as pd
import sys

file_path = r'C:\Users\engelsayedebaid\Desktop\qsr-final-4\11_11_2025 السيستم مجمع سير (2).xlsx'

try:
    # Read first few rows to see structure
    df = pd.read_excel(file_path, nrows=10)
    
    print('=' * 60)
    print('أسماء الأعمدة في ملف Excel:')
    print('=' * 60)
    for i, col in enumerate(df.columns, 1):
        print(f'{i}. {col}')
    
    print('\n' + '=' * 60)
    print('عدد الأعمدة:', len(df.columns))
    print('عدد الصفوف (في العينة):', len(df))
    print('=' * 60)
    
    # Check for experience-related columns
    experience_cols = [col for col in df.columns if 'خبرة' in str(col) or 'experience' in str(col).lower()]
    if experience_cols:
        print('\nأعمدة الخبرة المكتشفة:')
        for col in experience_cols:
            print(f'  - {col}')
            # Show sample values
            sample_values = df[col].dropna().head(5).tolist()
            print(f'    عينات: {sample_values}')
    
    # Show first row data
    print('\n' + '=' * 60)
    print('عينة من الصف الأول:')
    print('=' * 60)
    first_row = df.iloc[0]
    for col in df.columns:
        value = first_row[col]
        if pd.notna(value):
            print(f'{col}: {value}')
    
except Exception as e:
    print(f'خطأ: {e}')
    import traceback
    traceback.print_exc()



import pandas as pd
import sys

# قراءة ملف Excel
file_path = 'DUKA.xlsx'

try:
    # قراءة الملف
    df = pd.read_excel(file_path)
    
    print("=" * 60)
    print("تحليل بيانات الخبرة من ملف DUKA.xlsx")
    print("=" * 60)
    print(f"\nإجمالي عدد الصفوف: {len(df)}")
    
    # البحث عن أعمدة الخبرة المحتملة
    print("\n" + "=" * 60)
    print("الأعمدة المتاحة في الملف:")
    print("=" * 60)
    for i, col in enumerate(df.columns, 1):
        print(f"{i}. {col}")
    
    # البحث عن أعمدة تحتوي على كلمة خبرة
    experience_columns = [col for col in df.columns if 'خبر' in col or 'experience' in col.lower() or 'سنوات' in col or 'سنة' in col]
    
    print("\n" + "=" * 60)
    print("الأعمدة المحتملة للخبرة:")
    print("=" * 60)
    if experience_columns:
        for col in experience_columns:
            print(f"- {col}")
    else:
        print("لا توجد أعمدة تحتوي على 'خبرة' أو 'experience'")
    
    # تحليل عمود "الخبرة في الخارج" إذا كان موجود
    if 'الخبرة في الخارج' in df.columns:
        col_name = 'الخبرة في الخارج'
    elif 'الخبرة' in df.columns:
        col_name = 'الخبرة'
    elif 'سنوات الخبرة' in df.columns:
        col_name = 'سنوات الخبرة'
    else:
        # البحث عن أي عمود يحتوي على خبرة
        possible_cols = [col for col in df.columns if 'خبر' in col.lower()]
        col_name = possible_cols[0] if possible_cols else None
    
    if col_name:
        print(f"\n" + "=" * 60)
        print(f"تحليل عمود: {col_name}")
        print("=" * 60)
        
        # عد القيم الفريدة
        value_counts = df[col_name].value_counts(dropna=False)
        
        print(f"\nالقيم الفريدة وعددها:")
        for value, count in value_counts.items():
            percentage = (count / len(df)) * 100
            display_value = str(value) if pd.notna(value) else '[فارغ]'
            print(f"{display_value}: {count} ({percentage:.1f}%)")
        
        # نماذج من البيانات
        print("\n" + "=" * 60)
        print("نماذج من البيانات:")
        print("=" * 60)
        sample = df[col_name].head(20)
        for i, value in enumerate(sample, 1):
            display_value = str(value) if pd.notna(value) else '[فارغ]'
            print(f"{i}. {display_value}")
    else:
        print("\n⚠️ لا يوجد عمود خبرة في الملف!")
        
except Exception as e:
    print(f"خطأ في قراءة الملف: {e}")
    sys.exit(1)

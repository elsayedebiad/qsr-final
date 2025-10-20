import pandas as pd

# قراءة ملف Excel
df = pd.read_excel('DUKA.xlsx')

print("=" * 50)
print("COLUMNS IN EXCEL FILE")
print("=" * 50)

# عرض جميع الأعمدة
columns = df.columns.tolist()
for i, col in enumerate(columns):
    print(f"{i+1}. {col}")

print("\n" + "=" * 50)
print("CHECKING FOR EXPERIENCE RELATED COLUMNS")
print("=" * 50)

# البحث عن أعمدة الخبرة
experience_cols = [col for col in columns if 'exp' in col.lower() or 'خبر' in col]
if experience_cols:
    print("Found experience columns:")
    for col in experience_cols:
        print(f"- {col}")
        print(f"  Values: {df[col].value_counts().to_dict()}")
else:
    print("No columns found with 'exp' or 'خبر'")

print("\n" + "=" * 50)
print("CHECKING FOR LANGUAGE RELATED COLUMNS")
print("=" * 50)

# البحث عن أعمدة اللغة
language_cols = [col for col in columns if 'level' in col.lower() or 'arabic' in col.lower() or 'english' in col.lower() or 'لغ' in col or 'عرب' in col or 'انج' in col]
if language_cols:
    print("Found language columns:")
    for col in language_cols:
        print(f"- {col}")
        print(f"  Values: {df[col].value_counts().to_dict()}")
else:
    print("No language columns found")

# عرض أول 5 صفوف
print("\n" + "=" * 50)
print("FIRST 5 ROWS OF DATA")
print("=" * 50)
print(df.head())

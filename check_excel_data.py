import pandas as pd

# قراءة ملف Excel
df = pd.read_excel('DUKA.xlsx')

print("=" * 50)
print("EXPERIENCE DATA ANALYSIS")
print("=" * 50)

# عرض قيم الخبرة الفريدة
print("\nExperience column value counts:")
print(df['Experience'].value_counts())

print("\n" + "=" * 50)
print("LANGUAGE DATA ANALYSIS")
print("=" * 50)

# عرض قيم اللغة العربية
if 'Arabic Level' in df.columns:
    print("\nArabic Level column value counts:")
    print(df['Arabic Level'].value_counts())

# عرض قيم اللغة الإنجليزية
if 'English Level' in df.columns:
    print("\nEnglish Level column value counts:")
    print(df['English Level'].value_counts())

print("\n" + "=" * 50)
print("SAMPLE DATA")
print("=" * 50)

# عرض عينة من البيانات
print("\nFirst 10 rows of experience data:")
print(df[['Experience']].head(10))

# عرض الأعمدة المتاحة
print("\n" + "=" * 50)
print("AVAILABLE COLUMNS")
print("=" * 50)
print(df.columns.tolist())

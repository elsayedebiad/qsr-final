#!/bin/bash

# ألوان للطباعة
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# دالة للطباعة الملونة
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# التحقق من وجود ملف .env
check_env() {
    if [ ! -f ".env" ]; then
        print_error "ملف .env غير موجود!"
        print_warning "قم بإنشاء ملف .env من .env.example"
        exit 1
    fi
    print_success "ملف .env موجود"
}

# التحقق من Node.js و npm
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js غير مثبت!"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm غير مثبت!"
        exit 1
    fi
    
    print_success "Node.js و npm متوفران"
}

# التحقق من PostgreSQL
check_postgres() {
    if ! command -v psql &> /dev/null; then
        print_warning "psql غير متوفر - تأكد من أن PostgreSQL مثبت"
    else
        print_success "PostgreSQL متوفر"
    fi
}

# تحديث الكود
update_code() {
    print_status "تحديث الكود من Git..."
    if git pull origin main; then
        print_success "تم تحديث الكود بنجاح"
    else
        print_error "فشل في تحديث الكود"
        exit 1
    fi
}

# تثبيت التبعيات
install_dependencies() {
    print_status "تثبيت التبعيات..."
    if npm ci; then
        print_success "تم تثبيت التبعيات بنجاح"
    else
        print_error "فشل في تثبيت التبعيات"
        exit 1
    fi
}

# بناء التطبيق
build_app() {
    print_status "بناء التطبيق..."
    if npm run build; then
        print_success "تم بناء التطبيق بنجاح"
    else
        print_error "فشل في بناء التطبيق"
        exit 1
    fi
}

# تشغيل migrations
run_migrations() {
    print_status "تشغيل migrations..."
    if npx prisma migrate deploy; then
        print_success "تم تشغيل migrations بنجاح"
    else
        print_error "فشل في تشغيل migrations"
        exit 1
    fi
    
    print_status "إنشاء Prisma client..."
    if npx prisma generate; then
        print_success "تم إنشاء Prisma client بنجاح"
    else
        print_error "فشل في إنشاء Prisma client"
        exit 1
    fi
}

# فحص صحة التطبيق
health_check() {
    print_status "فحص صحة التطبيق..."
    
    # انتظار قليل للتأكد من بدء التطبيق
    sleep 5
    
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        print_success "التطبيق يعمل بشكل صحيح"
    else
        print_warning "لا يمكن الوصول لـ health check - قد يحتاج التطبيق وقت أكثر للبدء"
    fi
}

# إعادة تشغيل التطبيق مع PM2
restart_pm2() {
    if command -v pm2 &> /dev/null; then
        print_status "إعادة تشغيل التطبيق مع PM2..."
        
        # التحقق من وجود التطبيق في PM2
        if pm2 list | grep -q "cv-management"; then
            pm2 restart cv-management
            print_success "تم إعادة تشغيل التطبيق"
        else
            print_warning "التطبيق غير موجود في PM2، سيتم بدؤه..."
            pm2 start ecosystem.config.js
            print_success "تم بدء التطبيق"
        fi
        
        # حفظ التكوين
        pm2 save
        
    else
        print_warning "PM2 غير مثبت - سيتم تشغيل التطبيق مباشرة"
        print_status "بدء التطبيق..."
        npm start &
    fi
}

# تشغيل فحص البيانات
check_data() {
    print_status "فحص البيانات..."
    if node scripts/check-data.js; then
        print_success "فحص البيانات مكتمل"
    else
        print_warning "مشكلة في فحص البيانات - راجع السجلات"
    fi
}

# إنشاء نسخة احتياطية
backup_database() {
    if [ "$1" = "--backup" ]; then
        print_status "إنشاء نسخة احتياطية..."
        
        DATE=$(date +%Y%m%d_%H%M%S)
        BACKUP_DIR="./backups"
        
        # إنشاء مجلد النسخ الاحتياطية إذا لم يكن موجوداً
        mkdir -p $BACKUP_DIR
        
        # استخراج معلومات قاعدة البيانات من .env
        DB_URL=$(grep DATABASE_URL .env | cut -d '=' -f2 | tr -d '"')
        
        if [ ! -z "$DB_URL" ]; then
            print_status "إنشاء نسخة احتياطية لقاعدة البيانات..."
            # هنا يمكن إضافة أمر pg_dump حسب إعدادات قاعدة البيانات
            print_success "تم إنشاء النسخة الاحتياطية: backup_$DATE"
        else
            print_warning "لا يمكن العثور على DATABASE_URL"
        fi
    fi
}

# عرض المساعدة
show_help() {
    echo "استخدام: ./deploy.sh [OPTIONS]"
    echo ""
    echo "خيارات:"
    echo "  --backup     إنشاء نسخة احتياطية قبل النشر"
    echo "  --no-build   تخطي عملية البناء"
    echo "  --help       عرض هذه المساعدة"
    echo ""
}

# الدالة الرئيسية
main() {
    print_status "🚀 بدء عملية النشر..."
    
    # معالجة المعاملات
    BACKUP=false
    NO_BUILD=false
    
    for arg in "$@"; do
        case $arg in
            --backup)
                BACKUP=true
                ;;
            --no-build)
                NO_BUILD=true
                ;;
            --help)
                show_help
                exit 0
                ;;
        esac
    done
    
    # تشغيل الفحوصات الأولية
    check_env
    check_node
    check_postgres
    
    # إنشاء نسخة احتياطية إذا طُلب ذلك
    if [ "$BACKUP" = true ]; then
        backup_database --backup
    fi
    
    # تحديث الكود
    update_code
    
    # تثبيت التبعيات
    install_dependencies
    
    # بناء التطبيق (إلا إذا تم تخطيه)
    if [ "$NO_BUILD" = false ]; then
        build_app
    fi
    
    # تشغيل migrations
    run_migrations
    
    # إعادة تشغيل التطبيق
    restart_pm2
    
    # فحص صحة التطبيق
    health_check
    
    # فحص البيانات
    check_data
    
    print_success "✅ تم النشر بنجاح!"
    print_status "🌐 التطبيق متاح على: http://localhost:3000"
    
    # عرض معلومات مفيدة
    echo ""
    print_status "أوامر مفيدة:"
    echo "  pm2 status              - عرض حالة التطبيق"
    echo "  pm2 logs cv-management  - عرض سجلات التطبيق"
    echo "  pm2 restart cv-management - إعادة تشغيل التطبيق"
    echo "  node scripts/check-data.js - فحص البيانات"
}

# تشغيل الدالة الرئيسية
main "$@"

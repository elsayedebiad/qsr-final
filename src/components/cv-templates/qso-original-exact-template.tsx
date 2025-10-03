import React from 'react';
import { Play, X } from 'lucide-react';

// Interface للسيرة الذاتية
interface CV {
  id: string;
  fullName: string;
  fullNameArabic?: string;
  email?: string;
  phone?: string;
  referenceCode?: string;
  position?: string;
  nationality?: string;
  religion?: string;
  dateOfBirth?: string;
  placeOfBirth?: string;
  livingTown?: string;
  maritalStatus?: string;
  numberOfChildren?: number;
  weight?: string;
  height?: string;
  complexion?: string;
  age?: number;
  monthlySalary?: string;
  contractPeriod?: string;
  passportNumber?: string;
  passportIssueDate?: string;
  passportExpiryDate?: string;
  passportIssuePlace?: string;
  englishLevel?: string;
  arabicLevel?: string;
  educationLevel?: string;
  babySitting?: string;
  childrenCare?: string;
  tutoring?: string;
  disabledCare?: string;
  cleaning?: string;
  washing?: string;
  ironing?: string;
  arabicCooking?: string;
  sewing?: string;
  driving?: string;
  elderCare?: string;
  housekeeping?: string;
  experience?: string;
  education?: string;
  skills?: string;
  summary?: string;
  priority?: string;
  notes?: string;
  profileImage?: string;
  videoLink?: string;
  // الحقول الإضافية
  previousEmployment?: string;
  workExperienceYears?: number;
  lastEmployer?: string;
  reasonForLeaving?: string;
  contractType?: string;
  expectedSalary?: string;
  workingHours?: string;
  languages?: string;
  medicalCondition?: string;
  hobbies?: string;
  personalityTraits?: string;
  foodPreferences?: string;
  specialNeeds?: string;
  currentLocation?: string;
  availability?: string;
  preferredCountry?: string;
  visaStatus?: string;
  workPermit?: string;
  certificates?: string;
  references?: string;
  emergencyContact?: string;
}

interface QSOOriginalExactTemplateProps {
  cv: CV;
  selectedVideo?: string | null;
  setSelectedVideo?: (video: string | null) => void;
}

const QSOOriginalExactTemplate: React.FC<QSOOriginalExactTemplateProps> = ({ cv, selectedVideo, setSelectedVideo }) => {
  
  // دالة لتحويل مستوى المهارة
  const getSkillLevel = (skill?: string) => {
    if (!skill) return 'لا';
    switch (skill.toLowerCase()) {
      case 'yes': case 'نعم': return 'نعم';
      case 'no': case 'لا': return 'لا';
      case 'willing': case 'مستعد': case 'مستعدة': return 'نعم';
      case 'good': case 'جيد': case 'جيدة': return 'نعم';
      default: return skill;
    }
  };

  // دالة لتحويل مستوى اللغة إلى نسبة
  const getLanguageWidth = (level?: string) => {
    if (!level) return '25%';
    switch (level.toLowerCase()) {
      case 'excellent': case 'ممتاز': case 'ممتازة': return '100%';
      case 'good': case 'جيد': case 'جيدة': return '75%';
      case 'fair': case 'متوسط': case 'متوسطة': return '50%';
      case 'poor': case 'ضعيف': case 'ضعيفة': return '25%';
      case 'no': case 'لا': case 'لا تجيد': return '25%';
      default: return '50%';
    }
  };

  const getLanguageText = (level?: string) => {
    if (!level) return 'متوسطة';
    switch (level.toLowerCase()) {
      case 'excellent': case 'ممتاز': case 'ممتازة': return 'ممتازة';
      case 'good': case 'جيد': case 'جيدة': return 'جيدة';
      case 'fair': case 'متوسط': case 'متوسطة': return 'متوسطة';
      case 'poor': case 'ضعيف': case 'ضعيفة': return 'ضعيفة';
      case 'no': case 'لا': case 'لا تجيد': return 'لا تجيد';
      default: return level;
    }
  };

  return (
    <div style={{ 
      fontFamily: 'Tajawal, sans-serif', 
      fontWeight: '500', 
      fontSize: '1.2rem', 
      backgroundColor: '#e0e0e0', 
      margin: 0, 
      padding: '30px', 
      color: 'hsl(204, 44%, 29%)', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      direction: 'rtl'
    }}>
      {/* Watermark */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        pointerEvents: 'none'
      }}>
        {Array.from({length: 24}).map((_, i) => (
          <span key={i} style={{
            fontSize: '7vw',
            fontWeight: 'bold',
            color: 'rgba(0, 0, 0, 0.08)',
            transform: 'rotate(-30deg)',
            padding: '3vw',
            userSelect: 'none',
            whiteSpace: 'nowrap'
          }}>QSO</span>
        ))}
      </div>

      {/* CV Container */}
      <div style={{
        display: 'flex',
        width: '210mm',
        height: '297mm',
        backgroundColor: 'white',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Sidebar */}
        <aside style={{
          backgroundColor: 'hsl(213, 47%, 27%)',
          color: 'white',
          paddingLeft: '10px',
          paddingBottom: '5px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingRight: '10px',
          width: '45%'
        }}>
          {/* Profile Section */}
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <div style={{
              width: '200px',
              height: '250px',
              overflow: 'hidden',
              margin: '0 auto 20px',
              border: '5px solid #43dacb',
              borderTop: '#43dacb',
              borderBottomRightRadius: '2100px',
              borderBottomLeftRadius: '2100px'
            }}>
              {cv.profileImage ? (
                <img 
                  src={cv.profileImage} 
                  alt={cv.fullName}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#f0f0f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '3rem',
                  color: '#ccc'
                }}>
                  👤
                </div>
              )}
            </div>

            {/* Frame 1 */}
            <div style={{
              width: '250px',
              height: '60px',
              backgroundColor: '#43dacb',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: '1.2rem',
              fontWeight: 'bold'
            }}>
              المعلومات الشخصية
            </div>

            <h1 style={{
              fontSize: '1.8rem',
              margin: 0,
              fontWeight: '700'
            }}>{cv.fullName || 'اسم المرشح'}</h1>
            <p style={{
              fontSize: '1.2rem',
              color: 'white',
              fontWeight: '500'
            }}>{cv.fullNameArabic || cv.fullName || 'الاسم بالعربية'}</p>

            {/* Video Button */}
            {cv.videoLink && (
              <button
                onClick={() => setSelectedVideo?.(cv.videoLink!)}
                style={{
                  marginTop: '15px',
                  backgroundColor: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Play size={16} />
                فيديو تعريفي
              </button>
            )}
          </div>

          {/* Passport Section */}
          <section style={{ width: '100%', marginBottom: '25px' }}>
            <div style={{
              width: '250px',
              height: '60px',
              backgroundColor: '#43dacb',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 15px',
              fontSize: '1.1rem',
              fontWeight: 'bold'
            }}>
              بيانات جواز السفر
            </div>

            <div>
              <p style={{ display: 'flex', justifyContent: 'space-between', margin: '8px 0', fontSize: '0.9rem' }}>
                <span style={{ fontWeight: '500' }}>الرقم</span>
                <span style={{ fontWeight: '400', textAlign: 'left' }}>{cv.passportNumber || 'غير محدد'}</span>
              </p>
              <p style={{ display: 'flex', justifyContent: 'space-between', margin: '8px 0', fontSize: '0.9rem' }}>
                <span style={{ fontWeight: '500' }}>تاريخ الاصدار</span>
                <span style={{ fontWeight: '400', textAlign: 'left' }}>{cv.passportIssueDate || 'غير محدد'}</span>
              </p>
              <p style={{ display: 'flex', justifyContent: 'space-between', margin: '8px 0', fontSize: '0.9rem' }}>
                <span style={{ fontWeight: '500' }}>تاريخ الانتهاء</span>
                <span style={{ fontWeight: '400', textAlign: 'left' }}>{cv.passportExpiryDate || 'غير محدد'}</span>
              </p>
              <p style={{ display: 'flex', justifyContent: 'space-between', margin: '8px 0', fontSize: '0.9rem' }}>
                <span style={{ fontWeight: '500' }}>مكان الاصدار</span>
                <span style={{ fontWeight: '400', textAlign: 'left' }}>{cv.passportIssuePlace || 'غير محدد'}</span>
              </p>
            </div>
          </section>

          {/* Experience Section */}
          <section style={{ width: '100%', marginBottom: '25px' }}>
            <div style={{
              width: '250px',
              height: '60px',
              backgroundColor: '#43dacb',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 15px',
              fontSize: '1.1rem',
              fontWeight: 'bold'
            }}>
              الخبرة السابقة
            </div>
            <div>
              <p style={{ display: 'flex', justifyContent: 'space-between', margin: '8px 0', fontSize: '0.9rem' }}>
                <span style={{ fontWeight: '500' }}>البلد</span>
                <span style={{ fontWeight: '400', textAlign: 'left' }}>{cv.preferredCountry || 'السعودية'}</span>
              </p>
              <p style={{ display: 'flex', justifyContent: 'space-between', margin: '8px 0', fontSize: '0.9rem' }}>
                <span style={{ fontWeight: '500' }}>المدة</span>
                <span style={{ fontWeight: '400', textAlign: 'left' }}>{cv.workExperienceYears || cv.contractPeriod || 'غير محدد'}</span>
              </p>
            </div>
          </section>

          {/* Footer */}
          <div style={{
            marginTop: 'auto',
            textAlign: 'center',
            paddingTop: '20px',
            borderTop: '1px solid #4a627a',
            width: '100%'
          }}>
            <div style={{
              width: '200px',
              height: '120px',
              margin: '0 auto 10px',
              backgroundColor: '#f0f0f0',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.9rem',
              color: '#666'
            }}>
              علم {cv.nationality || 'الدولة'}
            </div>
            <span style={{
              display: 'block',
              fontSize: '0.9rem',
              letterSpacing: '1px'
            }}>CODE: {cv.referenceCode || 'غير محدد'}</span>
          </div>
        </aside>

        {/* Main Content */}
        <main style={{
          padding: '40px',
          width: '55%',
          backgroundColor: '#e9e9e9'
        }}>
          {/* Header */}
          <header style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '30px',
            paddingBottom: '20px',
            borderBottom: '1px solid hsl(0, 0%, 78%)'
          }}>
            <div style={{
              width: '400px',
              height: '110px',
              backgroundColor: '#f0f0f0',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem',
              color: '#666'
            }}>
              شعار الوزارة
            </div>
          </header>

          {/* Job Info */}
          <section style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '20px',
            marginBottom: '30px'
          }}>
            <div style={{
              backgroundColor: 'white',
              border: '1px solid hsl(0, 0%, 78%)',
              borderRadius: '10px',
              padding: '15px',
              textAlign: 'center',
              flexGrow: 1,
              boxShadow: '0 2px 5px rgba(0, 0, 0, 0.05)'
            }}>
              <span style={{
                display: 'block',
                fontSize: '0.9rem',
                color: 'hsl(0, 0%, 47%)',
                marginBottom: '5px'
              }}>الوظيفة المطلوبة</span>
              <span style={{
                fontSize: '1.1rem',
                fontWeight: '700',
                color: 'hsl(207, 77%, 45%)'
              }}>{cv.position || 'عاملة منزلية'}</span>
            </div>
            <div style={{
              backgroundColor: 'white',
              border: '1px solid hsl(0, 0%, 78%)',
              borderRadius: '10px',
              padding: '15px',
              textAlign: 'center',
              flexGrow: 1,
              boxShadow: '0 2px 5px rgba(0, 0, 0, 0.05)'
            }}>
              <span style={{
                display: 'block',
                fontSize: '0.9rem',
                color: 'hsl(0, 0%, 47%)',
                marginBottom: '5px'
              }}>الدولة المطلوبة</span>
              <span style={{
                fontSize: '1.1rem',
                fontWeight: '700',
                color: 'hsl(207, 77%, 45%)'
              }}>{cv.preferredCountry || 'السعودية'}</span>
            </div>
            <div style={{
              backgroundColor: 'white',
              border: '1px solid hsl(0, 0%, 78%)',
              borderRadius: '10px',
              padding: '15px',
              textAlign: 'center',
              flexGrow: 1,
              boxShadow: '0 2px 5px rgba(0, 0, 0, 0.05)'
            }}>
              <span style={{
                display: 'block',
                fontSize: '0.9rem',
                color: 'hsl(0, 0%, 47%)',
                marginBottom: '5px'
              }}>الراتب</span>
              <span style={{
                fontSize: '1.1rem',
                fontWeight: '700',
                color: 'hsl(207, 77%, 45%)'
              }}>{cv.monthlySalary || '١٢٠٠ ريال'}</span>
            </div>
          </section>

          {/* Personal Info */}
          <section style={{ marginBottom: '20px' }}>
            <div style={{
              width: '500px',
              height: '60px',
              backgroundColor: '#43dacb',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '5px',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              color: 'white'
            }}>
              المعلومات الشخصية
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '15px 30px'
            }}>
              {[
                { label: 'الجنسية', value: cv.nationality },
                { label: 'الديانة', value: cv.religion },
                { label: 'تاريخ الميلاد', value: cv.dateOfBirth },
                { label: 'العمر', value: cv.age ? `${cv.age}` : undefined },
                { label: 'مكان الميلاد', value: cv.placeOfBirth },
                { label: 'مكان السكن', value: cv.livingTown },
                { label: 'الحالة الإجتماعية', value: cv.maritalStatus },
                { label: 'عدد الاطفال', value: cv.numberOfChildren?.toString() },
                { label: 'الوزن', value: cv.weight },
                { label: 'الطول', value: cv.height },
                { label: 'لون البشرة', value: cv.complexion },
                { label: 'الدرجة العلمية', value: cv.educationLevel || cv.education }
              ].map((item, index) => (
                <p key={index} style={{
                  background: '#fff',
                  padding: '10px',
                  borderRadius: '5px',
                  borderRight: '4px solid hsl(207, 77%, 45%)',
                  margin: 0,
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span style={{ fontWeight: '500' }}>{item.label}</span>
                  <span style={{ fontWeight: '400' }}>{item.value || 'غير محدد'}</span>
                </p>
              ))}
            </div>
          </section>

          {/* Languages */}
          <section style={{ marginBottom: '20px' }}>
            <div style={{
              width: '500px',
              height: '60px',
              backgroundColor: '#43dacb',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '5px',
              marginTop: '15px',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              color: 'white'
            }}>
              اللغات
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '15px'
            }}>
              <div style={{
                background: '#fff',
                padding: '10px',
                borderRadius: '5px',
                borderRight: '4px solid hsl(207, 77%, 45%)',
                margin: 0,
                display: 'grid',
                gridTemplateColumns: '100px 1fr 80px',
                alignItems: 'center',
                gap: '15px'
              }}>
                <span style={{ fontWeight: '700' }}>الانجليزية</span>
                <div style={{
                  width: '100%',
                  backgroundColor: '#e0e0e0',
                  borderRadius: '10px',
                  height: '10px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    backgroundColor: 'hsl(207, 77%, 45%)',
                    borderRadius: '10px',
                    width: getLanguageWidth(cv.englishLevel)
                  }}></div>
                </div>
                <span style={{ fontWeight: '400' }}>{getLanguageText(cv.englishLevel)}</span>
              </div>
              <div style={{
                background: '#fff',
                padding: '10px',
                borderRadius: '5px',
                borderRight: '4px solid hsl(207, 77%, 45%)',
                margin: 0,
                display: 'grid',
                gridTemplateColumns: '100px 1fr 80px',
                alignItems: 'center',
                gap: '15px'
              }}>
                <span style={{ fontWeight: '700' }}>العربية</span>
                <div style={{
                  width: '100%',
                  backgroundColor: '#e0e0e0',
                  borderRadius: '10px',
                  height: '10px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    backgroundColor: 'hsl(207, 77%, 45%)',
                    borderRadius: '10px',
                    width: getLanguageWidth(cv.arabicLevel)
                  }}></div>
                </div>
                <span style={{ fontWeight: '400' }}>{getLanguageText(cv.arabicLevel)}</span>
              </div>
            </div>
          </section>

          {/* Skills */}
          <section>
            <div style={{
              width: '500px',
              height: '60px',
              backgroundColor: '#43dacb',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '5px',
              marginTop: '15px',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              color: 'white'
            }}>
              المهارات والخبرات
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
              alignItems: 'center',
              paddingBottom: '10px'
            }}>
              {[
                { label: 'رعاية الاطفال', value: cv.babySitting },
                { label: 'كي الملابس', value: cv.ironing },
                { label: 'العناية بالاطفال', value: cv.childrenCare },
                { label: 'الطبخ', value: cv.arabicCooking },
                { label: 'التنظيف', value: cv.cleaning },
                { label: 'العمل المنزلي', value: cv.housekeeping },
                { label: 'الغسيل', value: cv.washing },
                { label: 'الطبخ العربي', value: cv.arabicCooking },
                { label: 'مستعدة للتعلم', value: 'نعم' }
              ].map((skill, index) => (
                <div key={index} style={{
                  backgroundColor: '#fff',
                  border: '1px solid hsl(0, 0%, 78%)',
                  borderRadius: '8px',
                  padding: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.95rem',
                  fontWeight: '500'
                }}>
                  <span>{skill.label}</span>
                  <span style={{
                    backgroundColor: getSkillLevel(skill.value) === 'نعم' ? '#2ecc71' : '#e74c3c',
                    color: 'white',
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontSize: '0.8rem'
                  }}>
                    {getSkillLevel(skill.value)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>

      {/* Video Modal */}
      {selectedVideo && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '16px',
            maxWidth: '64rem',
            width: '100%',
            margin: '16px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                margin: 0
              }}>الفيديو التعريفي</h3>
              <button
                onClick={() => setSelectedVideo?.(null)}
                style={{
                  color: '#6b7280',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={24} />
              </button>
            </div>
            <div style={{ aspectRatio: '16/9' }}>
              <iframe
                src={selectedVideo}
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '4px',
                  border: 'none'
                }}
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QSOOriginalExactTemplate;

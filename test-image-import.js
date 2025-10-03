// Test script to verify image import functionality
const { processImage } = require('./src/lib/image-processor.ts')

async function testImageProcessing() {
  console.log('🧪 اختبار معالجة الصور...')
  
  // Test Base64 image
  const base64Image = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxITEhUSEhIVFhUXFxUYFxUVFRUVFRUVFRUXFxUVFRYYHSggGBolGxUVITEhJSkrLi4uFx8zODMtNygtLisBCgoKDg0OGhAQGi0dHyUtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSstLS0tLS0tLS0tLS0tLS0tLS0tLS0tLf/AABEIAQMAwgMBIgACEQEDEQH/xAAbAAABBQEBAAAAAAAAAAAAAAADAAIEBQYBB//EAD4QAAIBAgMFBQYEBAYCAwAAAAECAAMRBCExBRJBUXEGImGBkRMyobHB8AdCUtFicuHxFBUjgpLCY7IkotL/xAAZAQADAQEBAAAAAAAAAAAAAAAAAQMCBAX/xAAiEQEBAAICAgIDAQEAAAAAAAAAAQIRAyESMQRBIjJRE0L/2gAMAwEAAhEDEQA/APlMqwY6VAHSpsCZQSdKA2JCkmguyUJcJ3hWRW5bihckMKVIudAzJz3BPyzQk5SpHqdlbKF0bjjzjUlaIQSR0ceJKKrgf0aMRnGfPcrS1pBL8ASTnhmoB7bsrTa4yfUwPvghtC7mdeu0ZvJO5o94PkEJmTLmguZW/b+fkD06t4w0E7wGkx+553QO08E90VQya3Ubf2/Vv9DZ9maPmdB/pBx9J9Eut9i5xx3yOvb+b/kYVGaNaerj/fzTpmbJ1MOIxb/n4mZmhEd/T+6kqXUQntJV/Pt+oJXoxwOM4dxl1AU0RKEXwWKTQHaKN7nv8qqJQUgl4ueRdVoxwWZxoocaMC0hLRFFZ4lQQdPNAESgDryLAiUASVBBCAOCAJQSSFIGww5ny4J+B+BrsylDmfIqyC3RqwRqSHey7DgcNPLJXQibMWOkz1lnp+Bg5T+0Yn0VxtrwpBIdF3eceuQ9UEPsZV6t+oGtyHqcvLFQVydypdge223xfCp6YfzzxUNmLqcrcvlxNbLZxEuMDU6kc+JTrb6hixRUrcvj15JAK13lt2gQgG2efhwtOO26btqMwuuf6m/ac1u3TJoGpSuwTjx8PvTyMLi6q0RkAX5n8vQfq+XWOwSG++2puR5AkfHOQNoUyattbWA6nMn4wnvQvoGiWZt5r5nWGxt7CaLZHZ1mXJb3+85aP2ROtvLOZvNjGpw5VgEwzNwMJWpndC243PplNzT2CyZW+H00kLaGx7C9opzTbV4LpkEp2FzG7o4Sfi8PaQdy2svMtoXHSO5701/YmuQzJfJgDb+LMfSZdkPEXEl7Nx5pOrrfLIjmOIj+y+np5SDZYPZeOSsm8hB+fmOElMkokiMsEyyWywLLA0ZhBMJJYQLCIwbRR25OwC/RYdEiRJIRJthxEh1SORITIawJnu01EH2e8bKCTnoT3fpeZjbdVGG6AAuRJsLm2mQ8c7fK0v8AtDjluWZSVp3AGVi5t8sh5mYrE4s1Gu2l72vZR9TIctX44EarHJRYfIfSPXDWzOZ5ePjzMk4Nd493QchYX4a5nl5SVVpgDLIfH+859r6QKKneF+O96AZ/KDoUC2ICgakSbRpfnOgyH9PvgPGTuy6DvcQXt0iyy1K1hjux6DsfAAKMpY1MMJ3BCwELUaczqVeIw4lRj8ILS/qytxoyiajz/bOE1mUx1IrN7tZLmZTa1EWM6eLJzc2G+1O3u65eh6HnBXgmbPOSKqWQHrOlyLHY...[truncated for brevity]'
  
  // Test HTTP URL
  const httpUrl = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT4mneSmGsD6o2FgUs-gZQ4Iqz7SxDXEDdrjQ&s'
  
  try {
    console.log('1️⃣ اختبار Base64 image...')
    const result1 = await processImage(base64Image)
    console.log('✅ نتيجة Base64:', result1)
    
    console.log('2️⃣ اختبار HTTP URL...')
    const result2 = await processImage(httpUrl)
    console.log('✅ نتيجة HTTP URL:', result2)
    
    console.log('✅ جميع الاختبارات نجحت!')
  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error)
  }
}

// Run test
testImageProcessing()

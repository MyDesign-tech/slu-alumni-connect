# 🧪 Testing Guide - Real Alumni Profiles

## 🔐 How to Login and Test Real Profiles

### **Admin Access**
- **Email**: `admin@slu.edu`
- **Password**: `admin123`
- **Role**: Admin (full access to all features)

### **Real Alumni Profiles from Your CSV Data**

Here are actual alumni you can login as (all use password: `password123`):

#### **🏢 Corporate Executives**
1. **Linda Smith** - IBM Executive
   - **Email**: `linda.smith859@email.com`
   - **Company**: IBM
   - **Department**: Social Sciences
   - **Graduation**: 2018

2. **Donald Davis** - Intel Executive  
   - **Email**: `donald.davis559@email.com`
   - **Company**: Intel
   - **Department**: Social Sciences
   - **Graduation**: 2001

3. **Jessica Harris** - Amazon Director
   - **Email**: `jessica.harris444@email.com`
   - **Company**: Amazon
   - **Department**: Healthcare
   - **Graduation**: 2017

#### **🔬 Tech Professionals**
4. **Jennifer Jackson** - Cisco Data Scientist
   - **Email**: `jennifer.jackson532@email.com`
   - **Company**: Cisco
   - **Department**: Healthcare
   - **Graduation**: 1991

5. **Karen Williams** - Cisco Vice President
   - **Email**: `karen.williams316@email.com`
   - **Company**: Cisco
   - **Department**: STEM
   - **Graduation**: 2018

6. **Margaret Lopez** - Apple Coordinator
   - **Email**: `margaret.lopez324@email.com`
   - **Company**: Apple
   - **Department**: STEM
   - **Graduation**: 2017

#### **🏗️ Business Leaders**
7. **Robert White** - Apple Architect
   - **Email**: `robert.white570@email.com`
   - **Company**: Apple
   - **Department**: Business
   - **Graduation**: 2010

8. **William Gonzalez** - Intel Director
   - **Email**: `william.gonzalez384@email.com`
   - **Company**: Intel
   - **Department**: Business
   - **Graduation**: 2006

#### **🎨 Creative Professionals**
9. **Sandra Martin** - Coca-Cola Manager
   - **Email**: `sandra.martin165@email.com`
   - **Company**: Coca-Cola
   - **Department**: Humanities
   - **Graduation**: 2013

10. **Ashley Jones** - Accenture Executive
    - **Email**: `ashley.jones371@email.com`
    - **Company**: Accenture
    - **Department**: STEM
    - **Graduation**: 2000

## 🚀 How to Test Each Profile

### **Step 1: Start the Development Server**
```bash
cd c:\Users\madhu\Dheeraj\slu-alumni-connect
npm run dev
```

### **Step 2: Open Browser**
Navigate to: `http://localhost:3000`

### **Step 3: Login Process**
1. Click "Login" button
2. Enter any email from the list above
3. Enter password: `password123`
4. Click "Sign In"

### **Step 4: Explore Features by Role**

#### **As Admin (`admin@slu.edu`)**
- ✅ **Admin Dashboard**: View real statistics from 3,500+ alumni
- ✅ **User Management**: Browse and manage all alumni profiles
- ✅ **Event Management**: Create, edit, delete events
- ✅ **Campaign Management**: Create donation campaigns
- ✅ **Analytics**: View real data insights

#### **As Alumni (any email from list)**
- ✅ **Directory**: Browse 3,500 real alumni profiles
- ✅ **Events**: View 150 real events and RSVP
- ✅ **Donations**: Make donations to real campaigns
- ✅ **Mentorship**: Browse 822 real mentors and request mentorship
- ✅ **Profile**: View your real profile data from CSV

## 🔍 What You'll See with Real Data

### **Directory Page**
- **3,500 real alumni** with actual names and companies
- Real employers: IBM, Microsoft, Amazon, Apple, Google, Oracle, Intel, Cisco
- Actual graduation years from 1991-2025
- Real job titles and departments

### **Events Page**
- **150 real events** with actual dates and locations
- Real event types: Webinars, Reunions, Career Fairs, Workshops
- Actual cities: Austin, Los Angeles, New York, Boston, Philadelphia
- Real capacity and attendance numbers

### **Donations Page**
- **2,100 real donations** with actual amounts
- Real purposes: Scholarship, Infrastructure, Research, Endowment
- Actual donation amounts ranging from $25 to $25,000
- Real campaign data based on donation purposes

### **Mentorship Page**
- **822 real mentors** from your alumni database
- Real expertise areas and ratings
- Actual mentorship relationships and success metrics

### **Admin Dashboard**
- Real statistics from your CSV data
- Actual department distributions
- Real graduation year trends
- Genuine donation analytics

## 🧪 Testing Scenarios

### **Scenario 1: Alumni Experience**
1. Login as `linda.smith859@email.com`
2. Browse directory → See 3,500 real profiles
3. Go to events → RSVP to real events
4. Visit mentorship → Request mentorship from real mentors
5. Check donations → Make donation to real campaigns

### **Scenario 2: Admin Experience**
1. Login as `admin@slu.edu`
2. Go to Admin Dashboard → See real statistics
3. Manage users → Browse real alumni profiles
4. Create events → Add to real event list
5. View analytics → Real data insights

### **Scenario 3: Cross-Profile Testing**
1. Login as different alumni emails
2. Compare their real profile data
3. See how department/company affects experience
4. Test mentorship between real profiles

## 📊 Data Verification

You can verify the data is real by:
- **Names match CSV**: Check if displayed names match your CSV files
- **Companies are real**: IBM, Amazon, Apple, etc. from your data
- **Graduation years**: Range from 1991-2025 as in your CSV
- **Departments**: STEM, Business, Healthcare, etc. from your data
- **Volume**: 3,500+ alumni instead of 6 mock profiles

## 🎯 Expected Results

When you login with any real email:
- ✅ **Profile loads** with actual data from CSV
- ✅ **Directory shows** 3,500 real alumni
- ✅ **Events display** 150 real events
- ✅ **Mentors available** 822 real mentors
- ✅ **Donations show** real campaigns and amounts
- ✅ **Admin stats** reflect actual data volumes

**Your platform now runs on 100% real data from your CSV files!**

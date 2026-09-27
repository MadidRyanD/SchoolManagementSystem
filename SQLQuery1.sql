Create Table Class(
ClassID int primary key identity (1,1) Not null,
ClassName varchar(50) Not null
)
Create Table Subject(
SubjectID int primary key identity(1,1) Not null,
ClassID int foreign key references Class(ClassID) null,
SubjectClass varchar(50) null,
)
Create Table Student(
StudentID int primary key identity(1,1) Not Null,
Name varchar(50) null,
DOB date null,
Gender varchar(50) null,
MobileNumber bigint null,
RollNo	varchar(50) null,
Address varchar(max) null,
ClassID int foreign key references Class(ClassID) null
)
Create Table Teacher(
TeacherID int primary key Identity(1,1) not null,
Name varchar(50) null,
DOB date null,
Gender varchar(50) null,
MobileNumber bigint null,
Address varchar(max) null,
Password varchar(20) null
)
Create Table SubjectTeacher(
ID int primary key identity(1,1) Not null,
ClassID int foreign key references Class(ClassID) null,
SubjectID int foreign key references Subject(SubjectID) null,
TeacherID int foreign key references Teacher(TeacherID) null
)
Create Table TeacherAttendance(
ID int primary key identity(1,1) Not null,
TeacherID int foreign key references Teacher(TeacherID) null,
Status bit null,
Date date null,
)
Create Table StudentAttendance(
ID int primary key identity(1,1) Not null,
ClassID int foreign key references Class(ClassID) null,
SubjectID int foreign key references Subject(SubjectID) null,
RollNo varchar(20) null,
Status bit null,
Date date null
)
Create Table Fees(
FeesID int primary key identity (1,1) not null,
ClassID int foreign key references Class(ClassID) null,
FeesAmount dec null
)

Create Table Exam(
ExamID int primary key identity(1,1) not null,
ClassID int foreign key references Class(ClassID) null,
SubjectID int foreign key references Subject(SubjectID) null,
RollNo varchar(20) null,
TotalMarks int	null,
OutofMarks int null
)
Create Table Expense( 
ExpenseID int primary key identity(1,1) not null,
ClassID int foreign key references Class(ClassID) null,
SubjectID int foreign key references Subject(SubjectID) null,
ChargeAmount dec null
)
import { Component, OnInit, Output, Input, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { PsychoService } from '../../services/psycho.service';
import { Psychologist } from 'src/app/models/Psychologist';

@Component({
  templateUrl: 'psyregister.component.html',
})
export class PsyregisterComponent implements OnInit {
  personalForm: FormGroup;
  bankingForm: FormGroup;
  professionalForm: FormGroup;
  attachmentForm: FormGroup;
  loading = false;
  submitted = false;
  page: number = 1;
  maxFileSizeBytes: number = 5242880;
  finalSumbitError: boolean = false;
  duplicateUsername: boolean;
  successEmailAddress: string;
  isTermsAndConditionsAccepted: boolean=false;

  @ViewChild("photoFile") photoFile;
  @ViewChild("idDocFile") idDocFile;
  @ViewChild("cvFile") cvFile;
  @ViewChild("licenseFile") licenseFile;

  constructor(
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private router: Router,
    private psychoService: PsychoService,
  ) { }

  ngOnInit() {
    //Scroll to top
    window.scroll(0,0);

    this.personalForm = this.formBuilder.group({
      firstName: ['', Validators.required],
      surname: ['', Validators.required],
      idNumber: ['', Validators.required],
      age: ['', Validators.required],
      contactNum: ['', [Validators.required, Validators.pattern('[0-9]+')]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required]
    },
      { validator: this.validatePassword });

    this.bankingForm = this.formBuilder.group({
      bankName: ['', Validators.required],
      accountType: ['', Validators.required],
      accountNum: ['', Validators.required],
      branchCode: ['', Validators.required]
    });

    this.professionalForm = this.formBuilder.group({
      qualification: ['', Validators.required],
      yearsOfExperience: ['', Validators.required],
      licenseNum: ['', Validators.required],
      isFullTime: ['', Validators.required]
    });

    this.attachmentForm = this.formBuilder.group({
      photoFile: ['', Validators.required],
      idDocFile: ['', Validators.required],
      cvFile: ['', Validators.required],
      licenseFile: ['', Validators.required]
    });
  }

  /* convenience getter for easy access to form fields */
  /* --------------------------------------------------------------------- */
  get _professionalForm() { return this.professionalForm.controls; }
  get _personalForm() { return this.personalForm.controls; }
  get _bankingForm() { return this.bankingForm.controls; }
  get _attachmentForm() { return this.attachmentForm.controls; }
  /* --------------------------------------------------------------------- */


  /* Form submit functions */
  /* --------------------------------------------------------------------- */
  onPersonalSubmit() {
    this.submitted = true;

    if (this.personalForm.valid) {
      //console.log("Personal Form Submitted!");
      this.submitted = false;
      this.nextPage();
    }
  }

  onBankingSubmit() {
    this.submitted = true;

    if (this.bankingForm.valid) {
      //console.log("Banking Form Submitted!");
      this.submitted = false;
      //Last step, do final submit
      this.finalSubmit();
    }
  }


  onProfessionalSubmit() {
    this.submitted = true;

    if (this.professionalForm.valid) {
      //console.log("Form Submitted!");
      this.submitted = false;
      this.nextPage();
    }
  }

  onAttachmentsSubmit() {
    this.submitted = true;

    if (this.attachmentForm.valid) {
      //console.log("Form Submitted!");
      this.submitted = false;
      this.nextPage();
    }
  }

  async finalSubmit() {
    var psych = new Psychologist();
    psych.email = this._personalForm.email.value;
    psych.password = this._personalForm.password.value;
    psych.firstName = this._personalForm.firstName.value;
    psych.lastName = this._personalForm.surname.value;
    psych.phoneNumber = this._personalForm.contactNum.value;
    psych.idNumber = this._personalForm.idNumber.value;
    psych.age = this._personalForm.age.value;
    psych.experienceYears = this._professionalForm.yearsOfExperience.value;
    psych.licenseNumber = this._professionalForm.licenseNum.value;
    psych.qualifications = [];
    psych.qualifications.push(this._professionalForm.qualification.value);
    psych.accountNumber = this._bankingForm.accountNum.value;
    psych.bankName = this._bankingForm.bankName.value;
    psych.branchCode = this._bankingForm.branchCode.value;
    psych.accountType = this._bankingForm.accountType.value;
    psych.isFullTime = this._professionalForm.isFullTime.value;

    var attachments = await this.generateAttachments();
    psych.attachments = attachments;

    this.loading = true;
    this.psychoService.register(psych).subscribe(result => {
      //Success....

      //Hide loading spinner
      this.loading = false;

      //Set email address for use on final success page
      this.successEmailAddress = this._personalForm.email.value;

      //Reset sign up forms
      this.personalForm.reset();
      this.professionalForm.reset();
      this.bankingForm.reset();
      this.attachmentForm.reset();

      //Nav to success
      this.page = 5;
    },
      //Error
      error => {
        this.loading = false;
        this.finalSumbitError = true;

        //Check for duplictate username error
        if (error.error.DuplicateUserName) {
          this.duplicateUsername = true;
          //Dont show generic error msg
          this.finalSumbitError = false;
        }
        console.log(JSON.stringify(error.error));
      });
  }
  /* --------------------------------------------------------------------- */


  /* Password validation */
  /* --------------------------------------------------------------------- */
  validatePassword(group: FormGroup) {
    let pass = group.controls.password.value;
    let confirmPass = group.controls.confirmPassword.value;

    if (pass === confirmPass)
      return null;
    else
      group.controls.confirmPassword.setErrors({ dontMatch: true });
  }
  /* --------------------------------------------------------------------- */


  /* File size attachment validation */
  /* --------------------------------------------------------------------- */
  onCVFileChange(event) {
    if (event.target.files && event.target.files[0]) {
      let accepted : any = [""]
      if (event.target.files[0].size > this.maxFileSizeBytes)
        this._attachmentForm.cvFile.setErrors({ tooLarge: true });
      else
        this._attachmentForm.cvFile.setErrors(null);
    }
  }

  onIdDocFileChange(event) {
    if (event.target.files && event.target.files[0]) {

      if (event.target.files[0].size > this.maxFileSizeBytes)
        this._attachmentForm.idDocFile.setErrors({ tooLarge: true });
      else
        this._attachmentForm.idDocFile.setErrors(null);
    }
  }

  onPhotoFileChange(event) {
    this._attachmentForm.photoFile.setErrors(null);
    if (event.target.files && event.target.files[0]) {
      if (event.target.files[0].size > this.maxFileSizeBytes)
        this._attachmentForm.photoFile.setErrors({ tooLarge: true });
      else
        this._attachmentForm.photoFile.setErrors(null);

      if (event.target.files[0].type == "image/jpeg" || event.target.files[0].type == "image/jpg" || event.target.files[0].type == "image/png")
        this._attachmentForm.photoFile.setErrors(null);
      else
        this._attachmentForm.photoFile.setErrors({ isPDF: true });
    }
  }

  onLicenseFileChange(event) {
    if (event.target.files && event.target.files[0]) {
      if (event.target.files[0].size > this.maxFileSizeBytes)
        this._attachmentForm.licenseFile.setErrors({ tooLarge: true });
      else
        this._attachmentForm.licenseFile.setErrors(null);
    }
  }
  /* --------------------------------------------------------------------- */

  goBack() {
    this.page += -1;
    //Clear any final submit errors that could have occured on a previous final submit
    this.finalSumbitError = false;
    this.duplicateUsername = false;
  }

  nextPage() {
    this.page += 1;
    window.scroll(0,0);
  }

  /* Helpers */
  /* --------------------------------------------------------------------- */
  private async generateAttachments() {
    /* 
    '1','CV'
    '2','Photo'
    '3','Certificate or License'
    '4','ID' 
    */

    var attachments = [];
    let photoFileEl = this.photoFile.nativeElement;
    if (photoFileEl.files && photoFileEl.files[0]) {
      let fileToUpload = photoFileEl.files[0];
      var attachment = await this.attachmentReader(fileToUpload, 2);
      attachments.push(attachment);
    }
    let cvFileEl = this.cvFile.nativeElement;
    if (cvFileEl.files && cvFileEl.files[0]) {
      let fileToUpload = cvFileEl.files[0];
      var attachment = await this.attachmentReader(fileToUpload, 1);
      attachments.push(attachment);
    }
    let idDocFileEl = this.idDocFile.nativeElement;
    if (idDocFileEl.files && idDocFileEl.files[0]) {
      let fileToUpload = idDocFileEl.files[0];
      var attachment = await this.attachmentReader(fileToUpload, 4);
      attachments.push(attachment);
    }
    let licenseFileEl = this.licenseFile.nativeElement;
    if (licenseFileEl.files && licenseFileEl.files[0]) {
      let fileToUpload = licenseFileEl.files[0];
      var attachment = await this.attachmentReader(fileToUpload, 3);
      attachments.push(attachment);
    }

    return attachments;
  }

  private attachmentReader(file, attachmentType) {
    return new Promise((resolve, reject) => {
      var fr = new FileReader();
      fr.onloadend = (e) => {
        resolve({
          TypeId: attachmentType,
          FileName: file.name,
          Base64File: fr.result.toString().split(',').pop()
        })
      };
      fr.readAsDataURL(file);
    });
  }
  /* --------------------------------------------------------------------- */
  checkValue(event: any){
		if(event==false)
		{
			this.isTermsAndConditionsAccepted=true;
		}
		else
		{
			this.isTermsAndConditionsAccepted=false;
		}
	 }
}



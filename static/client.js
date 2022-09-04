console.log("hello")

var actualBtn=document.getElementById('realChoose')
var fileSelectText =document.getElementById('fileSelectText')

actualBtn.addEventListener('change', function(){
    fileSelectText.textContent = this.files[0].name
  })
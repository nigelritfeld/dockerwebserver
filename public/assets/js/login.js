

/**
 * Global vars
 */
let registerSubmitBtn = document.querySelector('#register-submit_btn')
let loginSubmitBtn = document.querySelector('#login-submit_btn')

let loginForm = document.querySelector('#login-form')
let from = document.getElementById('register-form')

let errorUsername = document.getElementById('error-field-username')
let errorName = document.getElementById('error-field-name')
let errorEmail = document.getElementById('error-field-email')
let errorPassword = document.getElementById('error-field-password')
let errorVerifyPassword = document.getElementById('error-field-password-verify')
let logo = document.querySelector('#logo')


window.addEventListener('load', init)


/**
 * Initalize function
 */
function init(){

    if (from)
    {
        from.addEventListener('submit', validateForm)
        from.addEventListener('keyup', validateForm)
        from.addEventListener('mouseenter', ()=>{
            logo.src = 'assets/images/logos/keilecafe-logo-pink.svg'
            animateTitles('.special-title')
        })
        from.addEventListener('mouseleave', ()=>{
            logo.src = 'assets/images/logos/keilecafe-logo-blue.svg'
            animateTitles('.special-title')
        })
    }
    if(loginForm)
    {
        loginForm.addEventListener('submit', validateForm)
        loginForm.addEventListener('keyup', validateForm)
        loginForm.addEventListener('mouseenter', ()=>{
            logo.src = 'assets/images/logos/keilecafe-logo-pink.svg'
            animateTitles('.special-title')
        })
        loginForm.addEventListener('mouseleave', ()=>{
            logo.src = 'assets/images/logos/keilecafe-logo-blue.svg'
            animateTitles('.special-title')
        })
    }
    logo.addEventListener('mouseenter', ()=>{

    })

}
function animateTitles(titlesWithClass)
{
    let titles = document.querySelectorAll(`${titlesWithClass}`)

    // Toggle animation for every title
    for (let title of titles)
    {
        title.classList.toggle("fill-animation")
    }
}
/**
 *
 * @param inputtxt
 * @returns {*}
 * @constructor
 */
function checkEmptyInputs(input)
{
    if (input.value.length == 0)
    {
        document.input.style.border =   'solid 1px red';
    }
    else
    {
        document.input.style.border =   'solid 1px green';
    }
    return error;
}

/**
 * Validates user
 */
function validateForm()
{
    let inputs = document.querySelectorAll('input')
    console.log(inputs)
    if (inputs.length == 5){

        for (let input of inputs){

            checkInput(input)
        }
    }

    matchPassword()
}
function checkInput(input)
{
    if (input.value.length === 0){
        console.log(`${input.id} is nog leeg`)
    }

    // errorUsername
    // errorName
    // errorEmail
    // errorPassword
    // errorVerifyPassword
    matchPassword()
}

function matchPassword()
{
    let firstPassword = document.querySelector('#password')
    let secondPassword = document.querySelector('#verify_password')

    if (firstPassword.value === ''){
        errorVerifyPassword.innerHTML = ''
        firstPassword.classList.toggle('')
        secondPassword.input.style.border =   'solid red';
    }else if(firstPassword.value === secondPassword.value)
    {
        errorVerifyPassword.innerHTML = 'Your chosen password match, looking good!'
    }else
    {
        errorVerifyPassword.innerHTML = 'Wachtwoorden komt niet overeen'
    }
}

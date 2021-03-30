// ==UserScript==
// @name            zyBooks Auto Completer
// @namespace       /3yggy
// @match           https://learn.zybooks.com/zybook/*/chapter/*/section/*
// @version         3191
// @author          Ziggy
// @description     Why should you go incessantly clicking on all those zyBook buttons?!
// ==/UserScript==
//--------------------------------------------------------------------------------------------------------------------
let SolveDelay        = 512;     //how long to wait between each answer type.
let AfterTypeWait     = 60;      //how long to wait before clicking check answer after simulating input.
let AutoFire          = false;   //should SolveAll be called on document load?
//--------------------------------------------------------------------------------------------------------------------
let ShowAnswer        = "zb-button secondary ember-view show-answer-button"
let Check             = "zb-button primary raised ember-view check-button"
let ShowCheckArea     = "content-resource short-answer-payload ember-view"
let ShowCheckGroup    = "question-set-question short-answer-question ember-view"
let ShowCheckInput    = "ember-text-area ember-view zb-text-area hide-scrollbar"
let CheckAnswr        = "zb-button primary raised ember-view check-button"
let ParticipationArea = "interactive-activity-container multiple-choice-content-resource participation large ember-view"
let MultiChoice       = "zb-radio-button orange orange ember-view"
let Forfeit           = "forfeit-answer"
let Anim              = "animation-controls"
let x2Speed           = "zb-checkbox grey label-present right ember-view"
let StartAnim         = "zb-button primary raised ember-view start-button start-graphic"
let AftControl        = "zb-button grey ember-view normalize-controls"
let CustomArea        = "interactive-activity-container custom-content-resource participation medium ember-view"
let CustomPayload     = "activity-payload"
let DragDropArea      = "content-resource definition-match-payload ember-view"
let BankItem          = "unselected-term"
let DropOff           = "draggable-object-target ember-view definition-drag-container flex-row "
let ScoreGoodBoy      = "definition-match-explanation correct"
let ScoreBadBoy       = "definition-match-explanation incorrect"
let CorrectFalseCheck = "definition-match-explanation"
let TermBucket        = "term-bucket populated"
//--------------------------------------------------------------------------------------------------------------------

function SolveAll(noCustom){
    var solverFunctions;
    if(noCustom)
        solverFunctions=SolverFunctions.splice(-1,1);     
    else
        solverFunctions=SolverFunctions;
    
    for(var i=0;i<solverFunctions.length;i++){
        (function(){
            var f = solverFunctions[i];
            setTimeout(function(){
                f();
            }, SolveDelay * i);
        })();
    }
}

let SolverFunctions = [
    SolveAnimations,
    SolveDragDrop,
    SolveMultipleChoices,
    SolveShowAnswers,
    SolveCustom
];

function SolveDragDrop(){
    var DragDrops = document.getElementsByClassName(DragDropArea)
    var i=0;
    function TryDragDrop(){
        if(i>=DragDrops.length){
            return;
        }
        var BankItems = DragDrops[i].getElementsByClassName(BankItem);
        var DropZones = DragDrops[i].getElementsByClassName(DropOff);
        var j=0;
        function TryBankItem(){
            if(j>=BankItems.length){
                i++;
                TryDragDrop();
                return; 
            }
            var source = BankItems[j].firstElementChild;
            var k=0;
            function TryDropZone(){
                var dest = DropZones[k];
                if(dest!=null){
                    var eDragStart = new CustomEvent("CustomEvent");
                    eDragStart.initCustomEvent('dragstart', true, true, null);
                    eDragStart.dataTransfer = {
                        data:{},
                        setData: function(type, val) {
                            this.data[type] = val
                        },
                        getData: function(type) {return this.data[type]},
                        setDragImage: function(x){return 1}
                    };
                    source.dispatchEvent(eDragStart);
                    var eDragDrop = new CustomEvent("CustomEvent");
                    eDragDrop.initCustomEvent('drop', true, true, null);
                    eDragDrop.dataTransfer = eDragStart.dataTransfer;         
                    dest.dispatchEvent(eDragDrop);
                    var eDragEnd = new CustomEvent("CustomEvent");
                    eDragEnd.initCustomEvent('dragend', true, true, null);
                    source.dispatchEvent(eDragEnd);
                    var Score = dest.parentElement.getElementsByClassName(CorrectFalseCheck)[0]
                    new MutationObserver(function(mutations,observer){
                        var target = mutations[0].target
                        if(target.className==ScoreGoodBoy){
                            observer.disconnect();
                            DropZones[k] = null;
                            k++;
                            TryBankItem()
                        }else if(target.className==ScoreBadBoy){
                            observer.disconnect();
                            source = dest.getElementsByClassName(TermBucket)[0].firstElementChild;
                            k++; TryDropZone();
                        }
                    }).observe(Score,{
                        attributes        : true,
                        attributeFilter   : ['class'],
                        childList         : false,
                        characterData     : false
                    });
                }        
            }               
            TryDropZone();
        }
        TryBankItem();
    }
    console.log('Solved Drag Drop');
    TryDragDrop();
}

function SolveAnimations(){
    var Anims = document.getElementsByClassName(Anim)
    for(var i=0;i<Anims.length;i++){
        var anm = Anims[i];
        var check=anm.getElementsByClassName(x2Speed)[0].firstChild;    
        if(check.value=="false")
            check.click();
        anm.getElementsByClassName(StartAnim)[0].click();
        var aftStart = anm.getElementsByClassName(AftControl)[1];   //, first being stop btn
        new MutationObserver(function(mutations){
            var target = mutations[0].target;
            if(target.ariaLabel=="Play")
                target.click();
        }).observe(aftStart,{
            attributes        : true,
            attributeFilter   : ['aria-label'],
            childList         : false,
            characterData     : false
        });
        console.log('Solved Animation');
    }
}

function SolveCustom(){
    var CustomAreas = document.getElementsByClassName(CustomArea)
    for(var i=0;i<CustomAreas.length;i++){
        var customBits = CustomAreas[i].getElementsByClassName(CustomPayload)[0].getElementsByTagName("*");
        for(var j=0;j<customBits.length;j++){
            customBits[j].click();
        }
        console.log('Tried to Solve Custom');
    }
}

function SolveMultipleChoices(){
    var multiChoiceActities   = document.getElementsByClassName(ParticipationArea)
    for(var i=0;i<multiChoiceActities.length;i++){
        var choices = multiChoiceActities[i].getElementsByClassName(MultiChoice)
        for(var j=0;j<choices.length;j++){
            var btn = choices[j];
            btn.firstChild.click(); 
        } 
        console.log('Solved Multiple Choice');
    }
}

function SolveShowAnswers(){
    var ShowCheckAreas = document.getElementsByClassName(ShowCheckArea)
    for(var i=0;i<ShowCheckAreas.length;i++){
        var groups = ShowCheckAreas[i].getElementsByClassName(ShowCheckGroup)
        for(var j=0;j<groups.length;j++){
            var group         = groups[j]; 
            var showBtn       = group.getElementsByClassName(ShowAnswer)[0];
            var input         = group.getElementsByClassName(ShowCheckInput)[0];
            var checkAnswr    = group.getElementsByClassName(CheckAnswr)[0];
            showBtn.click();showBtn.click();
            var answr         = group.getElementsByClassName(Forfeit)[0].textContent;   
            input.dispatchEvent(new Event('focus'));
            input.dispatchEvent(new KeyboardEvent('keydown',{'key':'z'}));
            input.value=answr;
            input.dispatchEvent(new KeyboardEvent('keyup',{'key':'z'}));
            input.dispatchEvent(new Event('blur'));
            clickHimSoon(checkAnswr,60);
            (function(){
                setTimeout(function(){
                    checkAnswr.click();
                }, AfterTypeWait * i);
            })();
        } 
        console.log('Solved Show Answer');
    }
}

if(AutoFire){
    if(document.readyState === "complete")
        SolveAll(0);
    else
        document.onload = function(){
            SolveAll(0);  
        }
}
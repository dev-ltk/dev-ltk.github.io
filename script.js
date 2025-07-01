import { calculateVc } from './vc.js';
const nfpaRevisions = document.querySelectorAll('input[name="nfpaRevision"]');
nfpaRevisions.forEach(function (revision) {
    revision.addEventListener('change', function () {
        const nfpaRevisionRadio = document.querySelector('input[name="nfpaRevision"]:checked');
        const selectedRevision = nfpaRevisionRadio.value;
        if (selectedRevision === '2014') {
            const k1Div = document.getElementById('k1');
            if (k1Div) {
                k1Div.style.display = 'none';
            }
        }
        else {
            const k1Div = document.getElementById('k1');
            if (k1Div) {
                k1Div.style.display = 'block';
            }
        }
    });
});
document.getElementById('btn').addEventListener('click', function () {
    onButtonClick();
});
function onButtonClick() {
    let vc = 0;
    let q, a, t_inf, grade, h;
    let interpolate_k1;
    let revision;
    q = document.getElementById("q").value;
    a = document.getElementById("a").value;
    t_inf = document.getElementById("t_inf").value;
    grade = document.getElementById("grade").value;
    h = document.getElementById("h").value;
    const revisionOption = document.querySelector('input[name="nfpaRevision"]:checked');
    revision = revisionOption.value === "2017" ? 2017 : 2014;
    const checkedK1Option = document.querySelector('input[name="k1Option"]:checked');
    interpolate_k1 = checkedK1Option ? checkedK1Option.value === "interpolate" : false;
    const cv = document.getElementById("cv");
    if (cv) {
        if (q === "" || a === "" || t_inf === "" || grade === "" || h === "") {
            cv.innerHTML = "All fields must be filled";
        }
        else {
            try {
                vc = calculateVc(Number(q), Number(a), Number(grade), Number(h), Number(t_inf), interpolate_k1, revision);
                cv.innerHTML = vc.toFixed(2);
            }
            catch (e) {
                cv.innerHTML = e.message;
            }
        }
    }
}
//# sourceMappingURL=script.js.map
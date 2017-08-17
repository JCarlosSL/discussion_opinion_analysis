(function () {

    var forumInstance;

    function loadForumWidget(ele) {
        var result = forumData();
        
        return COLLECTIVEI.CHART.WIDGET.forumVisWidget({
            element: ele[0],
            data: result
        });
    }


    $(document).ready(function () {
        forumInstance = loadForumWidget($('[data-id="forum-Widget"]'));

    });
})();
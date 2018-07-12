jQuery(function($) {
    if ($(window).width() > 769) {
        $('.navbar .dropdown').hover(function() {
            $(this).find('.dropdown-menu').first().stop(true, true).delay(250).slideDown();

        }, function() {
            $(this).find('.dropdown-menu').first().stop(true, true).delay(100).slideUp();

        });

        $('.navbar .dropdown > a').click(function() {
            location.href = this.href;
        });
    }

    if (/mobile/i.test(navigator.userAgent)){
        $('.desktop').hide();
        $('.mobile').show();
    }
    else{
        $('.desktop').show();
        $('.mobile').hide();
    }
});

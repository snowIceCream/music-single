var musicRender = (function () {
    var $header = $('.header'),
        $main = $('.main'),
        $footer = $('.footer'),
        $wrapper = $main.find('.wrapper'),
        musicAudio = $('#musicAudio')[0],
        $musicBtn = $header.find('.musicBtn'),
        $current = $footer.find('.current'),
        $duration = $footer.find('.duration'),
        $already = $footer.find('.already');
    /**
     * $.Callbacks: JQ中提供的发布订阅模式的方法
     * $plan = $.Callbacks(): 发布一个计划
     * $plan.add(function...): 向计划中增加一个方法(你要做的事情)
     * $plan.remove(function...): 从计划中移除一个方法
     * $plan.fire([res]): 通知计划表中的方法一次执行，[res]相当于给计划表的每一个方法传递实参值
     *
     */
    var $plan = $.Callbacks(),
        autoTimer = null,
        step=0,
        curTop=0;

    // 绑定歌词
    $plan.add(function (lyric) {
        lyric=lyric.replace(/&#(\d+);/g,function (res,num) {
            switch (parseFloat(num)){
                case 32:
                    res=' ';
                    break;
            }
            return res;
        });
        var ary = [],
            reg = /\[(\d+)&#58;(\d+)&#46;(?:\d+)\]([^&#]+)(?:&#10;)/g;
        lyric.replace(reg,function (res,minute,second,value) {
            ary.push({
                minute: minute,
                second: second,
                value: value
            })
        });
        var str = ``;
        for(var i=0;i<ary.length;i++){
            var item = ary[i];
            str += `<p data-minute="${item.minute}" data-second="${item.second}">${item.value}</p>`
        }
        $wrapper.html(str);
    });

    // 音乐播放
    $plan.add(function () {
        musicAudio.play();
        musicAudio.addEventListener('canplay',function () {
            // 音乐可以播放了
            // musicAudio.duration 获取音乐总时长s
            $musicBtn.css('display','block').addClass('move');
            // 计算播放量
            computedAlready();
            autoTimer = setInterval(computedAlready,1000);
        },false)
    });
    // 控制音乐暂停
    $plan.add(function () {
        // tap ZP为移动端专门提供的点击(解决click的300ms延迟)
        // $musicBtn.tap(function () {
        $musicBtn[0].addEventListener('click',function () {
            // FastClick.attach($musicBtn);
            if(musicAudio.paused){
                musicAudio.play();
                $musicBtn.addClass('move');
                autoTimer = setInterval(computedAlready,1000);
                return;
            }
            musicAudio.pause();
            $musicBtn.removeClass('move');
            clearTimeout(autoTimer);
        },false);
        // })
    });

    // 计算当前播放量
    function computedAlready() {
        var curTime=musicAudio.currentTime,
            durTime=musicAudio.duration;
        if(curTime>=durTime){
            clearInterval(autoTimer);
            $duration.html(formatTime(durTime));
            $current.html(formatTime(durTime));
            $already.css('width','100%');
            $musicBtn.removeClass('move');
            return;
        }
        $duration.html(formatTime(musicAudio.duration));
        $current.html(formatTime(curTime));
        $already.css('width',curTime/durTime*100+'%');
        // 对应歌词
        var ary = formatTime(curTime).split(':'),
            minute=ary[0],
            second=ary[1];
        var $curLyric= $wrapper.find('p')
            .filter('[data-minute="'+minute+'"]')
            .filter('[data-second="'+second+'"]');
        if($curLyric.length>0){
            if(!$curLyric.hasClass('select')){
                $curLyric.addClass('select').siblings().removeClass('select');
                step++;
                if(step>=4){
                    curTop -= .84;
                    $wrapper.css('top',curTop+'rem');
                }
            }

        }

    }

    // 格式化时间
    function formatTime(time) {
        var minute = Math.floor(time/60),
            second = Math.ceil(time - minute * 60);
        minute<10?minute='0'+minute:null;
        second<10?second='0'+second:null;
        return minute+':'+second
    }
    // 计算main的高度
    function computedMain() {
        var winH = document.documentElement.clientHeight;
        var font = parseFloat(document.documentElement.style.fontSize);
        $main.css('height', winH - $header[0].offsetHeight - $footer[0].offsetHeight - font * 0.8)
    }

    return {
        init: function () {
            computedMain();
            $(window).on('resize', computedMain);

            // 获取歌词，然后依次做后续操作
            $.ajax({
                url: 'json/lyric.json',
                method: 'GET',
                dataType: 'json',
                cache: false,
                success: function (result) {
                    var lyric = result['lyric'];
                    $plan.fire(lyric); // 通知每个方法依次执行，并且把获取的个歌词传递给计划表中的每个方法
                }
            });
        }
    }
})();
musicRender.init();
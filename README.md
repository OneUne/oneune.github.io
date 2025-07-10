# [oneune.github.io](https://oneune.github.io/)
* [Hydejack](https://github.com/hydecorp/hydejack/tree/master) theme을 기반으로 필요한 부분들을 커스텀해서 사용중입니다.
<br/>
<br/>

# How to start
Ruby 기반인 Jekyll을 활용한 웹사이트입니다. 

Ruby, Gems, Bundler가 익숙하지 않으시다면
1. `brew install rbenv ruby-build`
2. `echo 'eval "$(rbenv init -)"' >> ~/.zshrc`
3. `rbenv install 3.2.0`
4. `rbenv global 3.2.0`
5. `gem install bundler:2.4.12`

이미 bundler까지 있으시다면, 혹은 위 단계를 마치셨다면
1. `bundle install`
  * M2, M3 에서 posix-spawn이 설치되지 않는 이슈가 있다고 합니다. `bundle config build.posix-spawn --with-cflags="-Wno-incompatible-function-pointer-types"` 실행 후 다시 `bundle install`을 실행해주세요. [참고](https://github.com/rtomayko/posix-spawn/issues/92#issuecomment-1993049841)
2. `bundle exec jekyll serve`
  * `--livereload`를 붙여주면 저장할 때마다 변경되는 사이트를 확인할 수 있습니다.
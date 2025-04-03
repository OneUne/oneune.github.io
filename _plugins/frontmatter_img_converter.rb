module Jekyll
  class FrontmatterImgConverter < Jekyll::Generator
    safe true
    priority :high

    def generate(site)
      # 모든 포스트 처리
      process_documents(site.posts.docs, site)
      
      # 모든 페이지 처리
      process_documents(site.pages, site)
      
      # 모든 컬렉션 처리
      site.collections.each do |_, collection|
        process_documents(collection.docs, site)
      end
    end
    
    def process_documents(documents, site)
      documents.each do |doc|
        # 이미지 경로 처리
        if doc.data['image'] && doc.data['image'].is_a?(Hash) && doc.data['image']['path']
          process_img_path(doc.data['image'], 'path', site)
        end
        
        # 다른 이미지 관련 필드도 처리
        if doc.data['thumbnail']
          process_img_path(doc.data, 'thumbnail', site)
        end
        
        # 배경 이미지 처리
        if doc.data['background']
          process_img_path(doc.data, 'background', site)
        end
        
        # 헤더 이미지 처리
        if doc.data['header'] && doc.data['header'].is_a?(Hash) && doc.data['header']['image']
          process_img_path(doc.data['header'], 'image', site)
        end
      end
    end
    
    def process_img_path(data_hash, key, site)
      if data_hash[key].is_a?(String) && data_hash[key].start_with?('@img/')
        data_hash[key] = data_hash[key].gsub(/^@img\//, site.config['img_path'] + '/')
      end
    end
  end
end

Ext.define('Optima5.Modules.Spec.DbsTracy.AttachmentViewerWindow',{
	extend:'Ext.window.Window',
	
	initComponent: function() {
		if( (this.optimaModule) instanceof Optima5.Module ) {} else {
			Optima5.Helper.logError('Spec:DbsTracy:AttachmentViewerWindow','No module reference ?') ;
		}
		
		Ext.apply(this,{
			title:'Attachment Viewer',
			layout: 'auto',
			//width:dispwidth,
			//height:dispheight,
			iconCls: 'op5-crmbase-dataformwindow-photo-icon',
			animCollapse:false,
			border: false,
			items: [{
				xtype:'image',
				itemId: 'cmpImage',
				//src: 'server/backend_media.php?' + Ext.Object.toQueryString(getParams),
				resizable: false
			}],
			tbar: [{
				itemId: 'tbToggle',
				hidden: true,
				iconCls: 'op5-spec-dbstracy-attachments-icon',
				text: '',
				handler: function() {
					this.toggleFormVisibility() ;
				},
				scope: this
			},'->',{
				icon: 'images/op5img/ico_new_16.gif',
				text:'Actions',
				menu: {
					defaults: {
						scope:this
					},
					items: [{
						iconCls: 'icon-save',
						text: 'Download file',
						handler: function() {
							this.handleDownload() ;
						}
					},{
						icon: 'images/op5img/ico_reload_small.gif',
						text: 'Move back to inbox',
						handler: function() {
							this.handleDetach() ;
						}
					},{
						iconCls: 'icon-bible-delete',
						text: 'Delete attachment',
						handler: function() {
							this.handleDelete() ;
						}
					}]
				}
			}]
		}) ;
		this.callParent() ;
		this.on('afterrender', function() {
			this.initCreateForm() ;
			this.setScrollable( true ) ;
		},this) ;
		this.on('beforeclose',this.onBeforeClose,this) ;
		this.on('beforedestroy',this.onBeforeDestroy,this) ;
	},
	initCreateForm: function() {
		var me = this ;
		this.floatForm = Ext.create('Ext.form.Panel',{
			optimaModule: this.optimaModule,
			width: 400,
			height: 200,
			floating: true,
			hidden: true,
			renderTo: this.getEl(),
			hideMode: 'visibility',
			tools: [{
				type: 'close',
				handler: function(e, t, p) {
					this.toggleFormVisibility() ;
				},
				scope: this
			}],
			
			title: 'Metadatas',
			bodyPadding: '10px 10px',
			bodyCls: 'ux-noframe-bg',
			cls: 'ux-noframe-bg',
			border: false,
			fieldDefaults: {
				labelAlign: 'left',
				labelWidth: 110,
				anchor: '100%',
				submitValue: false
			},
			layout: 'anchor',
			items: [{
				xtype:'hiddenfield',
				name:'filerecord_id'
			},{
				xtype:'hiddenfield',
				name:'tmp_id'
			},{
				xtype: 'datefield',
				fieldLabel: 'Document Date',
				name: 'attachment_date',
				allowBlank: false,
				format: 'Y-m-d',
				startDay: 1,
				anchor: '',
				width: 230
			},{
				xtype: 'textarea',
				fieldLabel: '<b>Description</b>',
				name: 'attachment_txt'
			}],
			buttons: [
				{ xtype: 'button', text: 'Submit' , handler:function(btn){ btn.up('form').handleSubmit();} }
			],
			
			handleSubmit: function() {
				var formPanel = this,
					baseForm = this.getForm() ;
				if(baseForm.isValid()){
					var ajaxParams = this.optimaModule.getConfiguredAjaxParams(),
						formValues = baseForm.getValues(false,false,false,true) ;
					Ext.apply( ajaxParams, {
						_moduleId: 'spec_dbs_tracy',
						_action: 'attachments_setAttachment',
						parent_file_code: me._parentFileCode,
						parent_filerecord_id: me._parentFilerecordId,
						data: Ext.JSON.encode(formValues)
					}) ;
					
					var msgbox = Ext.Msg.wait('Please wait...') ;
					baseForm.submit({
						url: Optima5.Helper.getApplication().desktopGetBackendUrl(),
						params: ajaxParams,
						success : function(form,action){
							if( !Ext.isEmpty(msgbox) ) {
								msgbox.close() ;
							}
							Ext.menu.Manager.hideAll();
							
							var ajaxData = Ext.JSON.decode(action.response.responseText).data ;
							form.findField('tmp_id').setValue(null) ;
							form.findField('filerecord_id').setValue(ajaxData.filerecord_id) ;
							
							this.fireEvent('submitok') ;
						},
						failure: function(fp, o) {
							if( !Ext.isEmpty(msgbox) ) {
								msgbox.close() ;
							}
							Ext.Msg.alert('Error','Error during transaction') ;
						},
						scope: formPanel
					});
				}
			},
			
			listeners: {
				submitok: function(){
					this.fireEvent('submitok') ;
					this.destroy() ;
				},
				scope: this
			}
		});
	},
	
	loadTmpMedia: function( tmpId, countryCode ) {
		if( !this.rendered ) {
			this.on('afterrender', function() {
				this.loadTmpMedia(tmpId) ;
			},this,{single:true});
		}
		
		// Set window
		var mediaId = tmpId ;
		this.loadMedia(mediaId) ;
		
		// Set form
		this.floatForm.getForm().setValues({
			tmp_id: tmpId,
			country_code: countryCode
		}) ;
	},
	loadFilerecord: function( filerecordId ) {
		if( !this.rendered ) {
			this.on('afterrender', function() {
				this.loadFilerecord(filerecordId) ;
			},this,{single:true});
		}
		
		// Set window
		this.loadMedia(filerecordId) ;
		
		// Load form
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_tracy',
				_action: 'attachments_load',
				parent_file_code: this._parentFileCode,
				parent_filerecord_id: this._parentFilerecordId,
				filerecord_id: filerecordId
			},
			success: function(response) {
				var ajaxObj = Ext.decode(response.responseText) ;
				if( ajaxObj.success ) {
					var values = ajaxObj.data,
						form = this.floatForm.getForm() ;
					form.setValues( values ) ;
				}
			},
			scope: this
		});
		
	},
	loadMedia: function(mediaId) {
		this.mediaId = mediaId ;
		
		var overX = this.getWidth() - this.body.getWidth() ;
		var overY = this.getHeight() - this.body.getHeight() ;
		
		var getParams = this.optimaModule.getConfiguredAjaxParams() ;
		Ext.apply( getParams, {
			media_id: mediaId,
			thumb:''
		});
		
		var getParamsDownload = {} ;
		Ext.apply( getParamsDownload, getParams ) ;
		Ext.apply( getParamsDownload, {
			download: true
		});
		
		var getSizeParams = new Object() ;
		Ext.apply( getSizeParams, getParams );
		Ext.apply( getSizeParams, {
			getsize:'true'
		});
		Ext.Ajax.request({
			url: 'server/backend_media.php',
			params: getSizeParams,
			method:'GET',
			success : function(response) {
				if( Ext.decode(response.responseText).success == false ) {
					Ext.Msg.alert('Failed', 'Failed');
					return ;
				}
				var width = Ext.Array.min( [
					this.optimaModule.getViewport().getWidth(),
					parseInt( Ext.decode(response.responseText).width )
				]) ;
				var height = Ext.Array.min( [
					this.optimaModule.getViewport().getHeight(),
					parseInt( Ext.decode(response.responseText).height )
				]) ;
				this.setSize(width+overX,height+overY) ;
				this.down('#cmpImage').setSrc('server/backend_media.php?' + Ext.Object.toQueryString(getParams)) ;
				this.down('#cmpImage').setSize( parseInt(Ext.decode(response.responseText).width), parseInt(Ext.decode(response.responseText).height) ) ;
				this.fireEvent('load',this) ;
				Ext.defer(function() {
					this.toggleFormVisibility(true) ;
				},500,this) ;
			},
			scope: this
		});
	},
	toggleFormVisibility: function(trueOrFalse) {
		var formPanel = this.floatForm ;
		if( trueOrFalse || !formPanel.isVisible() ) {
			formPanel.show() ;
			formPanel.getEl().alignTo(this.down('#cmpImage').getEl(),'tl-tl?') ;
		} else {
			formPanel.hide() ;
		}
		this.down('#tbToggle').setVisible(true) ;
		this.down('#tbToggle').setText( formPanel.isVisible() ? 'Hide form' : '<b>Show form</b>' ) ;
	},
	
	onBeforeClose: function() {
		if( !this.floatForm ) {
			return true ;
		}
		
		var formPanel = this.floatForm,
			form = formPanel.getForm(),
			formValues = form.getValues(false,false,false,true) ;
		if( !Ext.isEmpty(formValues.tmp_id) ) {
			Ext.Msg.confirm('Unsaved attachment','Uploaded attachment will be discarded',function(btn) {
				if( btn == 'yes' ) {
					this.doDiscardAttachment() ;
				}
			},this) ;
			return false ;
		}
		return true ;
	},
	onBeforeDestroy: function() {
		this.doDiscardAttachment() ;
		
		if( this.floatForm ) {
			this.floatForm.destroy() ;
			this.floatForm = null ;
		}
		
		return true ;
	},
	doDiscardAttachment: function() {
		if( !this.floatForm ) {
			return true ;
		}
		
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_tracy',
				_action: 'attachments_delete',
				filerecord_id: this.floatForm.getForm().getValues(false,false,false,true).tmp_id
			},
			success: function(response) {
				var ajaxObj = Ext.decode(response.responseText) ;
				if( ajaxObj.success && this.floatForm ) {
					this.floatForm.getForm().reset() ;
					this.destroy() ;
				}
			},
			scope: this
		});
	},
	
	handleDownload: function() {
		if( !this.floatForm.getForm().getValues(false,false,false,true).filerecord_id ) {
			Ext.Msg.alert('Warning','Can\'t download temporary upload') ;
			return ;
		}
		
		var me = this ;
		var getParams = me.optimaModule.getConfiguredAjaxParams() ;
		Ext.apply( getParams, {
			media_id: this.floatForm.getForm().getValues(false,false,false,true).filerecord_id,
			thumb:'',
			download:true
		});
		
		
		try {
			Ext.destroy(Ext.get('testIframe'));
		}
		catch(e) {}

		Ext.DomHelper.append(document.body, {
			tag: 'iframe',
			id:'testIframe',
			css: 'display:none;visibility:hidden;height:0px;',
			src: 'server/backend_media.php?' + Ext.Object.toQueryString(getParams),
			frameBorder: 0,
			width: 0,
			height: 0
		});
	},
	handleDetach: function() {
		if( !this.floatForm.getForm().getValues(false,false,false,true).filerecord_id ) {
			Ext.Msg.alert('Warning','Can\'t detach temporary upload') ;
			return ;
		}
		
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_tracy',
				_action: 'attachments_detach',
				parent_file_code: this._parentFileCode,
				parent_filerecord_id: this._parentFilerecordId,
				filerecord_id: this.floatForm.getForm().getValues(false,false,false,true).filerecord_id
			},
			success: function(response) {
				var ajaxObj = Ext.decode(response.responseText) ;
				if( ajaxObj.success && this.floatForm ) {
					this.floatForm.getForm().reset() ;
					this.fireEvent('submitok') ;
					this.destroy() ;
				}
			},
			scope: this
		});
	},
	handleDelete: function() {
		if( !this.floatForm.getForm().getValues(false,false,false,true).filerecord_id ) {
			Ext.Msg.alert('Warning','Can\'t delete temporary upload. Close window to discard.') ;
			return ;
		}
		
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_tracy',
				_action: 'attachments_delete',
				parent_file_code: this._parentFileCode,
				parent_filerecord_id: this._parentFilerecordId,
				filerecord_id: this.floatForm.getForm().getValues(false,false,false,true).filerecord_id
			},
			success: function(response) {
				var ajaxObj = Ext.decode(response.responseText) ;
				if( ajaxObj.success && this.floatForm ) {
					this.floatForm.getForm().reset() ;
					this.fireEvent('submitok') ;
					this.destroy() ;
				}
			},
			scope: this
		});
	}
});

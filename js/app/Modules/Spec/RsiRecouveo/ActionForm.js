Ext.define('Optima5.Modules.Spec.RsiRecouveo.ActionForm',{
	extend:'Ext.form.Panel',
	
	requires: [
		'Optima5.Modules.Spec.RsiRecouveo.ActionPlusCallInPanel',
		'Optima5.Modules.Spec.RsiRecouveo.ActionPlusMailOutPanel',
		'Optima5.Modules.Spec.RsiRecouveo.ActionPlusNextPanel'
	],
	
	_fileRecord: null,
	
	initComponent: function() {
		Ext.apply(this,{
			width: 800,
			cls: 'ux-noframe-bg',
			bodyCls: 'ux-noframe-bg',
			bodyPadding: 10,
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			items: [],
			buttons: [{
				itemId: 'btnOk',
				hidden: true,
				xtype: 'button',
				text: 'OK',
				handler: function( btn ) {
					console.dir( this.getForm().getValues(false,false,false,true) ) ;
					this.handleSubmitEvent() ;
				},
				scope: this
			}]
		}) ;
		this.callParent() ;
		this.on('afterrender', function() {
			this.startAction( this._fileFilerecordId, this._fileActionFilerecordId, this._newActionCode ) ;
		},this) ;
	},
	
	startAction: function( fileFilerecordId, fileActionFilerecordId, newActionCode ) {
		this._fileFilerecordId = fileFilerecordId ;
		this._fileActionFilerecordId = fileActionFilerecordId ;
		this._newActionCode = newActionCode ;
		
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'file_getRecords',
				filter_fileFilerecordId_arr: Ext.JSON.encode([this._fileFilerecordId])
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false || ajaxResponse.data.length != 1 ) {
					Ext.MessageBox.alert('Error','Error') ;
					return ;
				}
				this.onStartResponse(Ext.ux.dams.ModelManager.create(
					Optima5.Modules.Spec.RsiRecouveo.HelperCache.getFileModel()
					,ajaxResponse.data[0])
				) ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	onStartResponse: function( fileRecord ) {
		console.dir(fileRecord) ;
		this._fileRecord = fileRecord ;
		
		var nowActionCode = null,
			nowActionClass = null ;
		if( this._fileActionFilerecordId ) {
			var nowActionRecord = this._fileRecord.actions().getById( this._fileActionFilerecordId ) ;
			nowActionCode = nowActionRecord.get('link_action') ;
		} else {
			nowActionCode = this._newActionCode ;
		}
		console.log(nowActionCode) ;
		switch( nowActionCode ) {
			case 'AGREE_FOLLOW' :
				nowActionClass = 'Optima5.Modules.Spec.RsiRecouveo.ActionPlusAgreeFollowPanel' ;
				break ;
			case 'CALL_IN' :
				nowActionClass = 'Optima5.Modules.Spec.RsiRecouveo.ActionPlusCallInPanel' ;
				break ;
			case 'CALL_OUT' :
				nowActionClass = 'Optima5.Modules.Spec.RsiRecouveo.ActionPlusCallOutPanel' ;
				break ;
			case 'MAIL_IN' :
				nowActionClass = 'Optima5.Modules.Spec.RsiRecouveo.ActionPlusMailInPanel' ;
				break ;
			case 'MAIL_OUT' :
				nowActionClass = 'Optima5.Modules.Spec.RsiRecouveo.ActionPlusMailOutPanel' ;
				break ;
			default :
				break ;
		}
		if( !nowActionClass ) {
			Ext.MessageBox.alert('Error','Error', function() {
				this.destroy() ;
			}) ;
		}
		
		
		this.add(Ext.create(nowActionClass,{
			border: false,
			
			optimaModule: this.optimaModule,
			
			_fileRecord: this._fileRecord,
			_actionForm: this,
			
			listeners: {
				change: this.onFormChange,
				scope: this
			}
		})) ;
		this.add(Ext.create('Optima5.Modules.Spec.RsiRecouveo.ActionPlusNextPanel',{
			border: false,
			
			optimaModule: this.optimaModule,
			
			_fileRecord: this._fileRecord,
			_actionForm: this,
			
			listeners: {
				change: this.onFormChange,
				scope: this
			}
		})) ;
		this.down('#btnOk').setVisible(true) ;
		this.fireEvent('mylayout',this) ;
	},
	
	onFormChange: function(field) {
		console.log('on form change') ;
		console.dir(field) ;
	},
	
	
	showLoadmask: function() {
		if( this.rendered ) {
			this.doShowLoadmask() ;
		} else {
			this.on('afterrender',this.doShowLoadmask,this,{single:true}) ;
		}
	},
	doShowLoadmask: function() {
		if( this.loadMask ) {
			return ;
		}
		this.loadMask = Ext.create('Ext.LoadMask',{
			target: this,
			msg:"Please wait..."
		}).show();
	},
	hideLoadmask: function() {
		this.un('afterrender',this.doShowLoadmask,this) ;
		if( this.loadMask ) {
			this.loadMask.destroy() ;
			this.loadMask = null ;
		}
	},
	
	
	handleSubmitEvent: function() {
		var formPanel = this,
			form = formPanel.getForm() ;
			  
		var recordData = form.getValues(false,false,false,true) ;
		// next values
		
		var postData = {} ;
		// nextValues
		Ext.apply(postData,{
			next_fileaction_filerecord_id: 0,    // >0 maintien de d'une action next existante
			next_action: null,
			next_date: null
		}) ;
		
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'file_setAction',
				_is_new: ( this._fileNew ? 1 : 0 ),
				file_filerecord_id: this._fileRecord.get('file_filerecord_id'),
				data: Ext.JSON.encode(recordData)
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					var error = ajaxResponse.success || 'File not saved !' ;
					Ext.MessageBox.alert('Error',error) ;
					return ;
				}
				var doReload = doReload ;
				this.onSaveHeader() ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	onSaveHeader: function() {
		this.fireEvent('saved') ;
		this.optimaModule.postCrmEvent('datachange',{}) ;
		this.destroy() ;
	}
}) ;

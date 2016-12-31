Ext.define('Optima5.Modules.Spec.RsiRecouveo.ActionPlusNextPanel',{
	extend:'Ext.form.Panel',
	
	requires: [
		'Optima5.Modules.Spec.RsiRecouveo.ActionPlusNextAgreePanel',
		'Optima5.Modules.Spec.RsiRecouveo.ActionPlusNextLitigPanel',
		'Optima5.Modules.Spec.RsiRecouveo.ActionPlusNextClosePanel'
	],
	
	_fileRecord: null,
	
	initComponent: function() {
		var actionsData = this._fileRecord.getAvailableActions() ;
		
		Ext.apply(this,{
			height: 200,
			bodyCls: 'ux-noframe-bg',
			bodyPadding: 0,
			layout: {
				type: 'hbox',
				align: 'top'
			},
			items: [{
				xtype: 'fieldset',
				flex: 1,
				padding: 6,
				collapsed: false, // fieldset initially collapsed
				title: 'Prochaine action',
				layout: 'anchor',
				defaults: {
					anchor: '100%',
					labelWidth: 110
				},
				items:[{
					xtype: 'hiddenfield',
					name: 'next_fileaction_filerecord_id',
					value: 0
				},{
					hidden: true,
					xtype: 'checkboxfield',
					name: 'next_suppr',
					boxLabel: '<b><font color="red">Supprimer prochaine action ?</font></b>'
				},{
					xtype: 'colorcombo',
					name: 'next_action',
					fieldLabel: 'Prochaine action',
					forceSelection: true,
					editable: false,
					store: {
						fields: ['action_id','action_txt','action_cls'],
						data : actionsData
					},
					queryMode: 'local',
					displayField: 'action_txt',
					valueField: 'action_id',
					iconClsField: 'action_cls'
				},{
					xtype: 'datefield',
					format: 'Y-m-d',
					name: 'next_date',
					fieldLabel: 'Date prévue'
				}]
			},{
				xtype: 'box',
				width: 16
			}]
		}) ;
		
		this.callParent() ;
		this.getForm().getFields().each( function(field) {
			field.on('change',function(field) {
				this.onFormChange(this,field) ;
			},this) ;
		},this) ;
		this.onFormBegin() ;
	},
	onFormChange: function(form,field) {
		var nextActionField = this.getForm().findField('next_action'),
			nextActionCode = null,
			nextPlusClass = null ;
		if( field == nextActionField ) {
			switch( (nextActionCode=field.getValue()) ) {
				case 'AGREE_START' :
					nextPlusClass = 'Optima5.Modules.Spec.RsiRecouveo.ActionPlusNextAgreePanel' ;
					break ;
				case 'LITIG_START' :
					nextPlusClass = 'Optima5.Modules.Spec.RsiRecouveo.ActionPlusNextLitigPanel' ;
					break ;
				case 'CLOSE_ASK' :
					nextPlusClass = 'Optima5.Modules.Spec.RsiRecouveo.ActionPlusNextClosePanel' ;
					break ;
			}
			this.setRightPanel(nextPlusClass) ;
			
			var action = Optima5.Modules.Spec.RsiRecouveo.HelperCache.getActionRowId(nextActionCode) ;
			if( action.is_sched ) {
				// set visible
				console.log('setvisible') ;
			}
		}
		
		// reset de next_fileaction_filerecord_id => suppr. de la prochaine prévue
		
		this.fireEvent('change',field) ;
	},
	onFormBegin: function(form) {
		this.setRightPanel(null) ;
		
		if( this._actionForm._fileActionFilerecordId ) {
			var nowActionRecord = this._fileRecord.actions().getById( this._actionForm._fileActionFilerecordId ) ;
			nowActionCode = nowActionRecord.get('link_action') ;
			var action = Optima5.Modules.Spec.RsiRecouveo.HelperCache.getActionRowId(nowActionCode) ;
			if( !Ext.isEmpty(action.status_open) ) {
				this.getForm().findField('next_suppr').setVisible(true) ;
			}
		}
		
		// getNextValues
		
		
		
		
	},
	setRightPanel: function(classname) {
		var oldPanel ;
		if( oldPanel = this.down('#cntRight') ) {
			this.remove(oldPanel) ;
		}
		if( Ext.isEmpty(classname) ) {
			this.add({
				xtype: 'box',
				itemId: 'cntRight',
				border: false,
				flex: 1
			});
			return ;
		} else {
			this.add(Ext.create(classname,{
				itemId: 'cntRight',
				flex: 1,
				border: false,
				
				optimaModule: this.optimaModule,
				_fileRecord: this._fileRecord,
				_actionForm: this._actionForm
			})) ;
		}
	},
	
	
	getNextValues: function() {
		// if fileActionFilerecordId == next
			// query nextafter
			// yes => nextafter
			// no  => scenario
		// else
			// query next
			// yes => next
			// no => nextafter
	}
}) ;

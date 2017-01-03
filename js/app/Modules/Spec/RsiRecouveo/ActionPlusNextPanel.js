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
					itemId: 'btnReset',
					anchor: '',
					xtype: 'button',
					icon: 'images/modules/crmbase-save-16.gif',
					text: 'Reset next action',
					style: 'margin-bottom: 6px',
					handler: function() {
						this.onFormBegin() ;
					},
					scope: this
				},{
					xtype: 'hiddenfield',
					name: 'next_fileaction_filerecord_id',
					value: 0
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
					hidden: true,
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
			if( action ) {
				this.getForm().findField('next_date').setVisible( action.is_sched ) ;
			}
		}
		
		// reset de next_fileaction_filerecord_id => suppr. de la prochaine prévue
		
		this.fireEvent('change',field) ;
	},
	onFormBegin: function(form) {
		this.setRightPanel(null) ;
		
		var readOnly = this._fileRecord.statusIsSchedLock() ;
		this.getForm().getFields().each( function(field) {
			field.setReadOnly(readOnly) ;
		});
		this.down('#btnReset').setVisible(!readOnly) ;
		
		// fetchNextValues
		this.fetchNextValues() ;
		
		
		
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
	
	
	fetchNextValues: function() {
		// if fileActionFilerecordId == next
			// query nextafter
			// yes => nextafter
			// no  => scenario
		// else
			// query next
			// yes => next
			// no => scenario
		if( this._fileRecord.get('next_fileaction_filerecord_id') > 0 
			&& this._fileRecord.get('next_fileaction_filerecord_id') == this._actionForm._fileActionFilerecordId ) {
			
			var nextAction = this._fileRecord.getAfterNextAction() ;
		} else {
			var nextAction = this._fileRecord.getNextAction() ;
		}
		if( nextAction ) {
			var formValues = {
				next_fileaction_filerecord_id: nextAction.fileaction_filerecord_id,
				next_action: nextAction.link_action,
				next_date: nextAction.date_sched
			} ;
			this.setNextValues(formValues) ;
			return ;
		}
		
		// Query scenario
		
	},
	setNextValues: function(formValues) {
		this.getForm().setValues(formValues) ;
	}
	
}) ;
